import React from "react";
import mapboxgl from "mapbox-gl";
import * as turf from '@turf/turf';
import "./css/MainApp.scss";
import "mapbox-gl/dist/mapbox-gl.css";
import CancelIcon from '@material-ui/icons/Cancel';
import IconButton from '@material-ui/core/IconButton';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AutoComplete from './AutoComplete/AutoComplete.js';
import TornadoChartPane from './TornadoChart/TornadoChart.js';
import ChannelChooser from './ChannelChooser/ChannelChooser.js';
import CustomizedSlider from './TimeSlider/TimeSlider.js';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import lightBlue from '@material-ui/core/colors/lightBlue';
import { MapboxLayer } from '@deck.gl/mapbox';
import { ArcLayer } from 'deck.gl';
import Grid from '@material-ui/core/Grid';
import { Paper } from '@material-ui/core';
import { withStyles } from '@material-ui/styles';
import ScaleChooser from './ScaleChooser/ScaleChooser';
import NegationChooser from './NegationChooser/NegationChooser';
import SimpleTabs from './TabbedPane/TabbedPane';
import geostats from 'geostats';
import geogCentroids from './centroids.json';

const styles = theme => ({
  searchPaper: {
    margin: 'auto',
    width: '100%',
    padding: 5
  },
  padding: {
    padding: 5
  },
  resultsPaper: {
    margin: 'auto',
    width: '100%',
    height: '100%',
    padding: 5,
    flexGrow: 1,
  },
  notChosen: {
    color: 'LightGrey'
  },
  chosenY: {
    color: 'Green'
  },
  chosenX: {
    color: 'Red'
  },
  filterButton: {
    paddingLeft: '2px',
    paddingRight: '2px',
    paddingTop: '2px',
    paddingBottom: '2px',
    border: '1px solid rgba(0, 126, 255, 0.24)'
  },
  filterImg: {
    height: '42px',
    width: '42px',
  },
  textSummaryClassesGrid: {
    height: '100%'
  },
  textClassesRow: {
    rowHeight: 20
  }
});

class MainApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerms: "",
      startDate: "201908",
      endDate: "202501",
      movProb: [10, 9, 8, 7, 6],
      channels: ['news'],
      bins: [],
      clickLngLats: [],
      statementsTableRows: [],
      bigramsTableRows: {},
      statementsTableUpdate: false,
      scale: 'bins1',
      binClasses: { 'type': 'jenks', 'numClasses': 5 },
      negation: ["movement", "nomovement"],
      tornadoData: [],
      tornadoUpdate: false,
      bigramUpdate: false,
      tabValue: 0
    };
    this.lng = 0;
    this.lat = 10;
    this.zoom = 2;
    this.bearing = 0;
    this.pitch = 30;
    this.maxZoom = 3.8;
    this.production = false;
    this.layers = {
      1: { 'name': 'bins1', 'url': 'mapbox://scottpez.ckgowj5ev0sk22bs6m3iwae4f-43d05' },
      2: { 'name': 'bins2', 'url': 'mapbox://scottpez.ckgowjxnx0jry27oxsch1epd3-2g530' },
      3: { 'name': 'states', 'url': 'mapbox://scottpez.ckgowlzft1i8x23mnky4ecv33-2vi4o' },
      4: { 'name': 'countries', 'url': 'mapbox://scottpez.ckgowoh3z1l1c22qik5l28lp0-1opjt' },
      5: { 'name': 'continents', 'url': 'mapbox://scottpez.ckgoz4ol50o0122mn5ddci5vg-5ojyo' },
    };
    this.selectedLayer = 1;
    this.previousLayer = 1;
    this.facadeBaseUrl = this.production ? "/facade/" : "http://localhost:8000/facade/";
    this.elasticGeostatementRequest = 'geostatement';
    this.elasticGeobinRequest = 'geobin';
    this.elasticSuggestRequest = 'suggest';
    this.geomovementLabelUpdateUrl = 'http://localhost:8081/PezResearchWeb/GeomovementLabelUpdate?';
    this.colorRamps = {
      'blue': { 1: '#c6dbef', 2: '#9ecae1', 3: '#6baed6', 4: '#3182bd', 5: '#08519c' },
      'maroon': {
        2: { 1: '#bcbddc', 2: '#756bb1' },
        3: { 1: '#cbc9e2', 2: '#9e9ac8', 3: '#6a51a3' },
        4: { 1: '#cbc9e2', 2: '#9e9ac8', 3: '#756bb1', 4: '#54278f' },
        5: { 1: '#dadaeb', 2: '#bcbddc', 3: '#9e9ac8', 4: '#756bb1', 5: '#54278f' },
        6: { 1: '#dadaeb', 2: '#bcbddc', 3: '#9e9ac8', 4: '#807dba', 5: '#6a51a3', 6: '#4a1486' },
        7: { 1: '#efedf5', 2: '#dadaeb', 3: '#bcbddc', 4: '#9e9ac8', 5: '#807dba', 6: '#6a51a3', 7: '#4a1486' },
      },
      'purple': { 1: '#f2f0f7', 2: '#cbc9e2', 3: '#9e9ac8', 4: '#756bb1', 5: '#54278f' },
      'grey': { 1: '#f7f7f7', 2: '#cccccc', 3: '#969696', 4: '#636363', 5: '#252525' },
      'yellowblue': { 1: '#ffffcc', 2: '#a1dab4', 3: '#41b6c4', 4: '#2c7fb8', 5: '#253494' }
    };
    this.dAlpha = 200;
    this.dAlpha2 = 150;
    this.mapStyles = {
      'bins': {
        'fill-opacity': 0.5,
        'fill-outline-color': '#969696'
      },
      'arcs': {
        'classes-line-color-source': {
          1: { 1: [0, 90, 50, 0] },
          2: { 1: [65, 171, 93, this.dAlpha2], 2: [0, 90, 50, 0] },
          3: { 1: [65, 171, 93, this.dAlpha2], 2: [35, 139, 69, 0], 3: [0, 90, 50, 0] },
          4: { 1: [186, 228, 179, this.dAlpha2], 2: [116, 196, 118, 0], 3: [49, 163, 84, 0], 4: [0, 109, 44, 0] },
          5: { 1: [199, 233, 192, this.dAlpha2], 2: [161, 217, 155, 0], 3: [116, 196, 118, 0], 4: [49, 163, 84, 0], 5: [0, 109, 44, 0] },
          6: { 1: [199, 233, 192, this.dAlpha2], 2: [161, 217, 155, 0], 3: [116, 196, 118, 0], 4: [65, 171, 93, 0], 5: [35, 139, 69, 0], 6: [0, 90, 50, 0] },
          7: { 1: [229, 245, 224, this.dAlpha2], 2: [199, 233, 192, 0], 3: [161, 217, 155, 0], 4: [116, 196, 118, 0], 5: [65, 171, 93, 0], 6: [35, 139, 69, 0], 7: [0, 90, 50, 0] }
        },
        'classes-line-color-target': {
          1: { 1: [0, 90, 50, this.dAlpha] },
          2: { 1: [65, 171, 93, this.dAlpha], 2: [0, 90, 50, this.dAlpha] },
          3: { 1: [65, 171, 93, this.dAlpha], 2: [35, 139, 69, this.dAlpha], 3: [0, 90, 50, this.dAlpha] },
          4: { 1: [186, 228, 179, this.dAlpha], 2: [116, 196, 118, this.dAlpha], 3: [49, 163, 84, this.dAlpha], 4: [0, 109, 44, this.dAlpha] },
          5: { 1: [199, 233, 192, this.dAlpha], 2: [161, 217, 155, this.dAlpha], 3: [116, 196, 118, this.dAlpha], 4: [49, 163, 84, this.dAlpha], 5: [0, 109, 44, this.dAlpha] },
          6: { 1: [199, 233, 192, this.dAlpha], 2: [161, 217, 155, this.dAlpha], 3: [116, 196, 118, this.dAlpha], 4: [65, 171, 93, this.dAlpha], 5: [35, 139, 69, this.dAlpha], 6: [0, 90, 50, this.dAlpha] },
          7: { 1: [229, 245, 224, this.dAlpha], 2: [199, 233, 192, this.dAlpha], 3: [161, 217, 155, this.dAlpha], 4: [116, 196, 118, this.dAlpha], 5: [65, 171, 93, this.dAlpha], 6: [35, 139, 69, this.dAlpha], 7: [0, 90, 50, this.dAlpha] }
        },
        'classes-line-width': {
          1: { 1: 3 },
          2: { 1: 3, 2: 31 },
          3: { 1: 3, 2: 16, 3: 31 },
          4: { 1: 3, 2: 11, 3: 21, 4: 31 },
          5: { 1: 3, 2: 9, 3: 16, 4: 24, 5: 31 },
          6: { 1: 3, 2: 7, 3: 13, 4: 19, 5: 25, 6: 31 },
          7: { 1: 3, 2: 6, 3: 11, 4: 16, 5: 21, 6: 26, 7: 31 }
        }
      },
      'highlight': {
        'line-color': '#f7fcb9',
        'line-opacity': 0.8,
        'line-width': 5
      }
    };
    this.map = null;
    this.statementsCount = 0;
  }
  setClassBreak = (newBinClasses) => {
    this.drawConnectionsLayer(undefined, undefined, newBinClasses);
    this.updateBins(undefined, newBinClasses);
    this.setState({ binClasses: newBinClasses });
  }
  setSearch = (params) => {
    let newParams = {};
    if (params.searchTerms) {
      newParams['searchTerms'] = params.searchTerms;
    }
    if (params.searchTerms === '') {
      newParams['searchTerms'] = ' ';
    }
    let startDate = '';
    let endDate = '';
    if (params.timeRange) {
      for (let i = 0; i < this.timeMarks.length; i++) {
        let mark = this.timeMarks[i];
        if (mark.value === params.timeRange[0]) {
          startDate = mark.tooltip.replace('-', '');
        }
        if (mark.value === params.timeRange[1]) {
          endDate = mark.tooltip.replace('-', '');
        }
        newParams['startDate'] = startDate;
        newParams['endDate'] = endDate;
      }
    }
    if (params.channels) {
      newParams['channels'] = params.channels;
    }
    if (params.negation) {
      newParams['negation'] = params.negation;
    }
    if (params.scale) {
      let keys = Object.keys(this.layers);
      let tempLayer = params.scale;
      if (tempLayer === 'bins') {
        tempLayer += this.getBinVersion();
      }
      newParams['scale'] = tempLayer;
      for (let i = 0; i < keys.length; i++) {
        if (this.layers[keys[i]].name === tempLayer) {
          this.selectedLayer = keys[i];
        }
      }
      this.handleLayers(newParams);
      this.retrieveLocationCounts(newParams);
    } else {
      this.retrieveStatements(newParams);
      this.retrieveLocationCounts(newParams);
    }
    if (newParams) {
      this.setState(newParams);
    }
  }
  timeMarks = [
    {
      value: 0,
      tooltip: '2019-07'
    },
    {
      value: 1,
      tooltip: '2019-08'
    },
    {
      value: 2,
      tooltip: '2019-09'
    },
    {
      value: 3,
      tooltip: '2019-10'
    },
    {
      value: 4,
      tooltip: '2019-11'
    },
    {
      value: 5,
      tooltip: '2019-12'
    },
    {
      value: 6,
      tooltip: '2020-01'
    },
    {
      value: 7,
      tooltip: '2020-02'
    },
    {
      value: 8,
      tooltip: '2020-03'
    },
    {
      value: 9,
      tooltip: '2020-04'
    },
    {
      value: 10,
      tooltip: '2020-05'
    },
    {
      value: 11,
      tooltip: '2020-06'
    },
    {
      value: 12,
      tooltip: '2020-07'
    },
    {
      value: 13,
      tooltip: '2020-08'
    },
    {
      value: 14,
      tooltip: '2020-09'
    },
    {
      value: 15,
      tooltip: '2020-10'
    },
    {
      value: 16,
      tooltip: '2020-11'
    },
    {
      value: 17,
      tooltip: '2020-12'
    },
  ]
  mylocations = {}
  mylocationsNames = {}
  formatDateForTable = (dateStr) => {
    let d = new Date(dateStr);
    let isoDate = d.toISOString();
    let shortDateStr = isoDate.slice(5, 10) + '-' + isoDate.slice(0, 4);
    return shortDateStr;
  }
  getUrlVars = () => {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
      vars[key] = value;
    });
    return vars;
  }
  getBinIdsFromFeatures = (point, lngLat, featuresType, features) => {
    let clickLngLats = [];
    if (point) {
      clickLngLats.push(lngLat);
    }
    if (featuresType === 'addFeatures' || featuresType === 'newScale') {
      for (let i = 0; i < this.state.clickLngLats.length; i++) {
        clickLngLats.push(this.state.clickLngLats[i]);
      }
    }
    let bins = [];
    if (features.length > 0) {
      let fkeys = Object.keys(features);
      for (let i = 0; i < fkeys.length; i++) {
        bins.push(features[fkeys[i]].properties.id);
        if (features[fkeys[i]].properties.n) {
          this.mylocationsNames[parseInt(features[fkeys[i]].properties.id)] = features[fkeys[i]].properties.n;
        } else {
          this.mylocationsNames[parseInt(features[fkeys[i]].properties.id)] = features[fkeys[i]].properties.id;
        }
        this.mylocations[parseInt(features[fkeys[i]].properties.id)] = [];
      }
    }
    if (featuresType === 'addFeatures') {
      for (let i = 0; i < this.state.bins.length; i++) {
        bins.push(this.state.bins[i]);
      }
    }
    let params = { 'bins': bins, 'clickLngLats': clickLngLats };
    return params;
  }
  getNewFeatures = (point, featuresType) => {
    let features = [];
    if (point) {
      let fs = this.map.queryRenderedFeatures(point, { layers: [this.layers[this.selectedLayer].name] });
      for (let j = 0; j < fs.length; j++) {
        features.push(fs[j]);
      }
    }
    if (featuresType === 'newScale') {
      for (let i = 0; i < this.state.clickLngLats.length; i++) {
        let mypoint = this.map.project(this.state.clickLngLats[i]);
        let fs = this.map.queryRenderedFeatures(mypoint, { layers: [this.layers[this.selectedLayer].name] });
        for (let j = 0; j < fs.length; j++) {
          features.push(fs[j]);
        }
      }
    }
    return features;
  }
  sendRequests = (point, lngLat, featuresType, newFeatures, newParams) => {
    if (newFeatures.length > 0 || featuresType === 'newScale') {
      let params = this.getBinIdsFromFeatures(point, lngLat, featuresType, newFeatures);
      newParams = Object.assign({}, newParams, params);
      this.setState(newParams);
    } else if (this.state.bins.length > 0) {
      let bins = this.state.bins;
      for (let i = 0; i < bins.length; i++) {
        this.mylocations[bins[i]] = [];
      }
    }
    this.retrieveStatementsSend(newParams);
  }
  retrieveStatements = (newParams, e) => {
    let point;
    let lngLat;
    let featuresType = ''
    if (e && e.point && e.originalEvent && e.originalEvent.ctrlKey) {
      point = e.point;
      lngLat = e.lngLat;
      featuresType = 'addFeatures';
    } else if (e && e.point) {
      point = e.point;
      lngLat = e.lngLat;
      featuresType = 'newFeatures';
    } else if (newParams && newParams.scale) {
      featuresType = 'newScale';
    }
    if (featuresType === 'newFeatures' || featuresType === 'newScale') {
      this.mylocations = {};
      this.mylocationsNames = {};
    }
    let newFeatures = this.getNewFeatures(point, featuresType);
    if (newFeatures.length > 0) {
      this.sendRequests(point, lngLat, featuresType, newFeatures, newParams);
    } else {
      this.setState({ 'bigramsTableRows': [] });
      if (this.map.getLayer('arcs')) this.map.removeLayer('arcs');
      let tempfilter = this.map.getFilter(this.layers[this.selectedLayer].name);
      let ids = [-10];
      tempfilter[2][1] = ids;
      this.map.setFilter('highlight', tempfilter);
      if (this.map.getLayer('highlightLabels1')) { this.map.removeLayer('highlightLabels1') };
      if (this.map.getLayer('highlightLabels2')) { this.map.removeLayer('highlightLabels2') };
    }
  }
  statementButtonStyles = {}
  getUniqueFeatures = (array, comparatorProperty) => {
    let existingFeatureKeys = {};
    let uniqueFeatures = array.filter(function (el) {
      if (existingFeatureKeys[el.properties[comparatorProperty]]) {
        return false;
      } else {
        existingFeatureKeys[el.properties[comparatorProperty]] = true;
        return true;
      }
    });
    return uniqueFeatures;
  }
  getClassBreaks = (vals, newBinClasses) => {
    let numClasses;
    let type;
    if (newBinClasses) {
      numClasses = newBinClasses.numClasses;
      type = newBinClasses.type;
    } else {
      numClasses = this.state.binClasses.numClasses;
      type = this.state.binClasses.type;
    }
    if ([...new Set(vals)].length < numClasses) {
      numClasses = [...new Set(vals)].length - 1;
    }
    let classBreaks;
    if (numClasses > 0) {
      let mygeostats = new geostats(vals);
      switch (type) {
        case 'jenks':
          classBreaks = mygeostats.getClassJenks(numClasses);
          break;
        case 'eqInterval':
          classBreaks = mygeostats.getClassEqInterval(numClasses);
          break;
        case 'stdDeviation':
          classBreaks = mygeostats.getClassStdDeviation(numClasses);
          classBreaks = classBreaks.slice(classBreaks.length - numClasses, classBreaks.length);
          classBreaks.unshift(1);
          break;
        case 'arithmeticProgression':
          classBreaks = mygeostats.getClassArithmeticProgression(numClasses);
          break;
        case 'geometricProgression':
          classBreaks = mygeostats.getClassGeometricProgression(numClasses);
          break;
        case 'quantile':
          classBreaks = mygeostats.getClassQuantile(numClasses);
          break;
        default:
          break;
      }
    } else {
      classBreaks = [vals[vals.length - 1] + 1, vals[vals.length - 1] + 2];
    }
    return classBreaks;
  }
  drawConnectionsLayer = (connections, newBinClasses) => {
    if (!connections) {
      if (this.map.getLayer('arcs')) {
        connections = this.map.getLayer('arcs').implementation.props.data;
        let connArr = Object.values(connections);
        if (connArr.length > 0) {
          let tempValues = [];
          for (let i = 0; i < connArr.length; i++) {
            tempValues.push(connArr[i].val);
          }
          let breakers = this.getClassBreaks(tempValues, newBinClasses);
          let myClass = 1;
          for (let i = 0; i < connArr.length; i++) {
            let conn = connArr[i];
            let val = tempValues[i];
            if (val > breakers[myClass + 1]) {
              myClass++;
            }
            conn.myClass = myClass + 1;
          }
          let connectionsData = [];
          for (let i = 0; i < connArr.length; i++) {
            let connection = connArr[i];
            let myClass2 = connection.myClass;
            let sColor = this.mapStyles.arcs['classes-line-color-source'][breakers.length - 1][myClass2];
            let tColor = this.mapStyles.arcs['classes-line-color-target'][breakers.length - 1][myClass2];
            connectionsData.push({
              'source': connection.source,
              'target': connection.target,
              'sColor': sColor,
              'tColor': tColor,
              'val': connection.val,
              'myClass': myClass2,
              'width': this.mapStyles.arcs['classes-line-width'][breakers.length - 1][myClass2]
            });
          }
          if (this.map.getLayer('arcs')) this.map.removeLayer('arcs');
          this.map.addLayer(new MapboxLayer({
            id: 'arcs',
            type: ArcLayer,
            greatCircle: true,
            getHeight: 0,
            data: connectionsData,
            getSourcePosition: d => d.source,
            getTargetPosition: d => d.target,
            getSourceColor: d => d.sColor,
            getTargetColor: d => d.tColor,
            getWidth: d => d.width
          }));
        }
      }
    } else {
      let connKeys = Object.keys(connections);
      let connObj = {};
      for (let i = 0; i < connKeys.length; i++) {
        let parts = connKeys[i].split('_');
        let sourceId = parseInt(parts[0]);
        let targetId = parseInt(parts[1]);
        if (!connObj[sourceId]) {
          connObj[sourceId] = [];
        }
        connObj[sourceId].push({ 'source': sourceId, 'target': targetId, 'count': connections[connKeys[i]] });
      }
      let ks = Object.keys(connObj);
      if (ks.length > 0) {
        let connectionsData = [];
        for (let j = 0; j < ks.length; j++) {
          let cs = connObj[ks[j]];
          cs.sort((x, y) => {
            if (x.count < y.count) {
              return -1;
            }
            if (x.count > y.count) {
              return 1;
            }
            return 0;
          });
          let tempValues = [];
          for (let i = 0; i < cs.length; i++) {
            tempValues.push(cs[i].count);
          }
          let breakers = this.getClassBreaks(tempValues, newBinClasses);
          let myClass = 0;
          for (let i = 0; i < cs.length; i++) {
            let conn = cs[i];
            let val = tempValues[i];
            if (val > breakers[myClass + 1]) {
              myClass++;
            }
            conn['myClass'] = myClass + 1;
          }
          for (let i = 0; i < cs.length; i++) {
            let connection = cs[i];
            let myClass2 = connection.myClass;
            let sourceId = connection.source;
            let targetId = connection.target;
            let sColor = this.mapStyles.arcs['classes-line-color-source'][breakers.length - 1][myClass2];
            let tColor = this.mapStyles.arcs['classes-line-color-target'][breakers.length - 1][myClass2];
            let sourceCoords = geogCentroids[this.layers[this.selectedLayer].name][sourceId];
            let targetCoords = geogCentroids[this.layers[this.selectedLayer].name][targetId];
            if (sourceCoords && targetCoords) {
              connectionsData.push({
                'source': sourceCoords,
                'target': targetCoords,
                'sColor': sColor,
                'tColor': tColor,
                'val': connection.count,
                'myClass': myClass2,
                'width': this.mapStyles.arcs['classes-line-width'][breakers.length - 1][myClass2]
              });
            } else {
              console.log(sourceId + '/' + sourceCoords);
              console.log(targetId + '/' + targetCoords);
            }
          }
        }
        if (this.map.getLayer('arcs')) this.map.removeLayer('arcs');
        this.map.addLayer(new MapboxLayer({
          id: 'arcs',
          type: ArcLayer,
          greatCircle: true,
          getHeight: 0,
          data: connectionsData,
          getSourcePosition: d => d.source,
          getTargetPosition: d => d.target,
          getSourceColor: d => d.sColor,
          getTargetColor: d => d.tColor,
          getWidth: d => d.width
        }));
      }
    }
  }
  drawStatementsLayers = () => {
    let keys = Object.keys(this.mylocations);
    let connections = {};
    let allids = [];
    let clickIds = [];
    for (let i = 0; i < keys.length; i++) {
      const binId = parseInt(keys[i]);
      clickIds.push(binId);
      let statements = this.mylocations[binId];
      for (let j = 0; j < statements.length; j++) {
        let statement = statements[j];
        if (!this.production) {
          this.statementButtonStyles[statements[j].statementId + '_y'] = this.props.classes.notChosen;
          this.statementButtonStyles[statements[j].statementId + '_x'] = this.props.classes.notChosen;
        }
        allids.push(binId);
        const otherBinIds = statement['otherBinIds' + this.getBinVersion()];
        if (otherBinIds) {
          for (let k = 0; k < otherBinIds.length; k++) {
            const otherbinId = parseInt(otherBinIds[k]);
            allids.push(otherbinId);
            if (binId !== -1 && otherbinId !== -1 && binId !== otherbinId) {
              if (connections[binId + '_' + otherbinId]) {
                connections[binId + '_' + otherbinId]++;
              } else {
                connections[binId + '_' + otherbinId] = 1;
              }
            }
          }
        }
      }
    }
    if (connections !== {}) {
      this.drawConnectionsLayer(connections);
    }
    if (clickIds.length > 0) {
      this.handleHighlightLabels(clickIds);
    }
  }
  setStatements = (myStatements) => {
    let myCurrentStatements = [];
    for (let i = 0; i < myStatements.length; i++) {
      let statement1 = myStatements[i];
      let items = myCurrentStatements.filter(statement2 => (statement2.statementId === statement1.statementId));
      if (items.length === 0) {
        myCurrentStatements.push(statement1);
      }
    }
    this.setState({
      'statementsTableRows': myCurrentStatements,
      statementsTableUpdate: !this.state.statementsTableUpdate
    });
  }
  buildParamString = (requestParams) => {
    let requestParamsStr = '';
    const entries = Object.entries(requestParams);
    for (const [param, pvalue] of entries) {
      requestParamsStr += param + '=' + pvalue + '&';
    }
    return requestParamsStr.substring(0, requestParamsStr.length - 1);
  }
  buildRetrieveStatementsRequest = (newParams) => {
    let requestParams = {
      'ts': newParams.startDate ? newParams.startDate : this.state.startDate,
      'te': newParams.endDate ? newParams.endDate : this.state.endDate,
      'i': newParams.channels ? newParams.channels.join() : this.state.channels.join(),
      't': this.elasticGeostatementRequest,
      'p': newParams.movProb ? newParams.movProb : this.state.movProb.join(',')
    };
    if (newParams.bins) {
      requestParams['b'] = newParams.bins.join(',');
    } else if (this.state.bins.length > 0) {
      requestParams['b'] = this.state.bins.join(',');
    }
    if (newParams.searchTerms) {
      requestParams['c'] = newParams.searchTerms;
    } else if (this.state.searchTerms !== '') {
      requestParams['c'] = this.state.searchTerms;
    }
    if (newParams && newParams.negation) {
      requestParams['n'] = newParams.negation.join();
    } else {
      requestParams['n'] = this.state.negation.join();
    }
    if (newParams && newParams.scale) {
      requestParams['s'] = newParams.scale;
    } else {
      requestParams['s'] = this.state.scale;
    }
    let requestParamsStr = this.buildParamString(requestParams);
    let url = this.facadeBaseUrl + '?' + requestParamsStr;
    let request = fetch(url).then(res => res.json());
    return request;
  }
  parseStatements = (myData) => {
    const key1 = 'b';
    const key2 = 'ob';
    let myStatements = [];
    for (let i = 0; i < myData.length; i++) {
      let obj = {
        'id': i,
        'statementId': myData[i]['id'],
        'content': myData[i]['c'],
        'contentHTML': myData[i]['u'] + '::::' + myData[i]['c'],
        'published': this.formatDateForTable(myData[i]['p']),
        'label': -1,
      }
      obj['otherBinIds' + this.getBinVersion()] = myData[i][key2];
      if (Object.keys(this.mylocations).length !== 0) {
        if (this.mylocations[myData[i][key1]]) {
          this.mylocations[myData[i][key1]].push(obj);
        }
      }
      myStatements.push(obj);
      this.statementsCount++;
    }
    return myStatements;
  }
  parseBigrams = (myData) => {
    const keys1 = Object.keys(myData);
    let bigramsList = {};
    for (let i = 0; i < keys1.length; i++) {
      const binId = keys1[i];
      let binName = this.mylocationsNames[binId];
      if (!binName) {
        binName = 'World'
      }
      const data2 = myData[binId];
      bigramsList[binName] = [];
      const keys = Object.keys(data2);
      for (let j = 0; j < keys.length; j++) {
        let bigram = keys[j];
        let count = data2[keys[j]];
        bigramsList[binName].push({ 'id': j.toString(), 'bigram': bigram, 'count': count });
      }
    }
    this.setState({ 'bigramsTableRows': bigramsList });
  }
  removeBigram = (id, binName) => {
    let bigrams = this.state.bigramsTableRows;
    bigrams[binName].splice(bigrams[binName].findIndex(item => item.id === id), 1);
    this.setState({ 'bigramsTableRows': bigrams, 'bigramUpdate': !this.state.bigramUpdate });
  }
  retrieveStatementsSend = (newParams) => {
    let request = this.buildRetrieveStatementsRequest(newParams);
    request.then(myData => {
      if (myData['s'].length > 0) {
        let myStatements = this.parseStatements(myData['s']);
        this.drawStatementsLayers();
        this.setStatements(myStatements);
      }
      if (Object.keys(myData['bi']).length > 0) {
        this.parseBigrams(myData['bi'], myData['b']);
      }
    });
  }
  popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  })
  binData = {}
  updateBins = (lData, newBinClasses) => {
    if (lData) {
      this.binData = lData;
    } else {
      lData = this.binData;
    }
    let bins = Object.keys(lData);
    bins.sort(function (a, b) { return lData[a] - lData[b] });
    let tempValues = [];
    for (let i = 0; i < bins.length; i++) {
      tempValues.push(lData[bins[i]]);
    }
    let classBreaks = this.getClassBreaks(tempValues, newBinClasses);
    let myClass = 0;
    let binIdColors = [];
    let ids = [];
    for (let i = 0; i < bins.length; i++) {
      let binKey = parseInt(bins[i]);
      let val = tempValues[i];
      if (val > classBreaks[myClass + 1]) {
        myClass++;
      }
      binIdColors.push(binKey);
      ids.push(binKey);
      binIdColors.push(this.colorRamps.maroon[classBreaks.length - 1][myClass + 1])
    }
    if (binIdColors.length === 0) {
      binIdColors.push(-10);
      binIdColors.push(this.colorRamps.maroon[2][myClass + 1])
    }
    this.mapStyles.bins['fill-color'] = ['match', ['get', 'id'], ...binIdColors, '#000000'];
    let tempfilter = this.map.getFilter(this.layers[this.selectedLayer].name);
    if (ids.length === 0) {
      ids.push(-10);
    }
    tempfilter[2][1] = ids;
    this.map.setFilter(this.layers[this.selectedLayer].name, tempfilter);
    this.map.setPaintProperty(this.layers[this.selectedLayer].name, 'fill-color', this.mapStyles.bins['fill-color']);
  }
  updateTornado = (myData) => {
    let data = [];
    let keys = Object.keys(myData);
    for (let i = 0; i < keys.length; i++) {
      let date = keys[i];
      let tm = 0;
      let tnm = 0;
      let fm = 0;
      let fnm = 0;
      if (myData[keys[i]].t_m) {
        tm = myData[keys[i]].t_m;
      }
      if (myData[keys[i]].t_nm) {
        tnm = myData[keys[i]].t_nm;
      }
      if (myData[keys[i]].f_m) {
        fm = myData[keys[i]].f_m;
      }
      if (myData[keys[i]].f_nm) {
        fnm = myData[keys[i]].f_nm;
      }
      data.push({ "date": date, 't': 'tm', 'count': tm });
      data.push({ "date": date, 't': 'tnm', 'count': tnm });
      data.push({ "date": date, 't': 'fm', 'count': fm });
      data.push({ "date": date, 't': 'fnm', 'count': fnm });
    }
    data.sort(function (a, b) {
      // sort objects by the type first so that filtered gets drawn on top of total
      if (a.t > b.t) return -1;
      if (a.t < b.t) return 1;

      // next, sort objects by date ascending
      let aDate = new Date(parseInt(a.date.split('-')[0]), parseInt(a.date.split('-')[1]));
      let bDate = new Date(parseInt(b.date.split('-')[0]), parseInt(b.date.split('-')[1]));
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;
      return 0;
    });
    this.setState({
      "tornadoData": data,
      "tornadoUpdate": !this.state.tornadoUpdate
    });
  }
  retrieveLocationCounts = (newParams) => {
    let requestParams = {
      't': this.elasticGeobinRequest,
      'p': this.state.movProb.join(',')
    };
    if (newParams && newParams.searchTerms) {
      requestParams['c'] = newParams.searchTerms;
    } else if (this.state.searchTerms !== '') {
      requestParams['c'] = this.state.searchTerms;
    }
    if (newParams && newParams.startDate) {
      requestParams['ts'] = newParams.startDate;
    } else {
      requestParams['ts'] = this.state.startDate;
    }
    if (newParams && newParams.endDate) {
      requestParams['te'] = newParams.endDate;
    } else {
      requestParams['te'] = this.state.endDate;
    }
    if (newParams && newParams.channels) {
      requestParams['i'] = newParams.channels.join();
    } else {
      requestParams['i'] = this.state.channels.join();
    }
    if (newParams && newParams.negation) {
      requestParams['n'] = newParams.negation.join();
    } else {
      requestParams['n'] = this.state.negation.join();
    }
    if (newParams && newParams.scale) {
      requestParams['s'] = newParams.scale;
    } else {
      requestParams['s'] = this.state.scale;
    }
    let requestParamsStr = this.buildParamString(requestParams);
    let url = this.facadeBaseUrl + '?' + requestParamsStr;
    fetch(url).then(resp => resp.json())
      .then(myData => {
        this.updateBins(myData.l);
        this.updateTornado(myData.n);
      });
  }
  getBinVersion = () => {
    const zoom = this.map.getZoom();
    if (zoom > 2.5) {
      return '2';
    } else {
      return '1';
    }
  }
  getLargestFeatures = (features) => {
    let returnFeatures = {};
    for (let i = 0; i < features.length; i++) {
      let newArea = turf.area(features[i]);
      if (!returnFeatures[features[i].properties.id] || newArea > returnFeatures[features[i].properties.id].properties.area) {
        features[i].properties.area = newArea;
        returnFeatures[features[i].properties.id] = features[i];
      }
    }
    return returnFeatures;
  }
  highlightTextSize = 16;
  handleHighlightLabels = (ids) => {
    const filter = ['in', ['get', 'id'], ['literal', ids]];

    if (this.map.getLayer('highlightLabels1')) { this.map.removeLayer('highlightLabels1') };
    if (this.map.getLayer('highlightLabels2')) { this.map.removeLayer('highlightLabels2') };
    let tempfilter = this.map.getFilter(this.layers[this.selectedLayer].name);
    if (ids.length === 0) {
      ids.push(-10);
    }
    tempfilter[2][1] = ids;
    this.map.setFilter('highlight', tempfilter);
    if (this.layers[this.selectedLayer].name.includes('bins')) {
      this.map.addLayer({
        'id': 'highlightLabels1',
        'type': 'symbol',
        'source': this.layers[this.selectedLayer].name,
        'source-layer': this.layers[this.selectedLayer].name,
        'filter': filter,
        'layout': {
          'text-field': ['get', 'id'],
          "text-size": this.highlightTextSize,
          'symbol-placement': "point"
        }
      });
    } else {
      let features = this.map.querySourceFeatures(this.layers[this.selectedLayer].name, { 'sourceLayer': this.layers[this.selectedLayer].name, 'filter': filter });
      let largestFeatures = this.getLargestFeatures(features);
      if (largestFeatures !== {}) {
        let hData = {
          "type": "FeatureCollection",
          "features": []
        };
        let keys = Object.keys(largestFeatures);
        for (let i = 0; i < keys.length; i++) {
          let c = turf.centroid(largestFeatures[keys[i]]);
          c.properties.name = largestFeatures[keys[i]].properties.n;
          hData.features.push(c);
        }
        this.map.getSource('highlightLabels2').setData(hData);
        this.map.addLayer({
          'id': 'highlightLabels2',
          'type': 'symbol',
          'source': 'highlightLabels2',
          'layout': {
            'text-field': ['get', 'name'],
            "text-size": this.highlightTextSize
          }
        });
      }
    }
  }
  previousLayerName = ''
  removePreviousLayer = () => {
    if (this.map.getLayer('highlight')) { this.map.removeLayer('highlight') };
    if (this.map.getLayer('highlightLabels1')) { this.map.removeLayer('highlightLabels1') };
    if (this.map.getLayer('highlightLabels2')) { this.map.removeLayer('highlightLabels2') };
    if (this.map.getLayer(this.previousLayerName)) { this.map.removeLayer(this.previousLayerName) };
    if (this.map.getSource(this.previousLayerName)) { this.map.removeSource(this.previousLayerName) };
    if (this.map.getLayer(this.layers[this.selectedLayer].name)) { this.map.removeLayer(this.layers[this.selectedLayer].name) };
    if (this.map.getSource(this.layers[this.selectedLayer].name)) { this.map.removeSource(this.layers[this.selectedLayer].name) };
    if (this.map.getLayer('arcs')) this.map.removeLayer('arcs');
  }
  handleLayers = (params) => {
    if (params) {
      this.removePreviousLayer();
      this.map.addSource(this.layers[this.selectedLayer].name,
        {
          'type': 'vector',
          'url': this.layers[this.selectedLayer].url
        });
    } else {
      this.map.addSource(this.layers[this.selectedLayer].name,
        {
          'type': 'vector',
          'url': this.layers[this.selectedLayer].url
        });
      let hData = {
        "type": "FeatureCollection",
        "features": []
      };
      this.map.addSource('highlightLabels2',
        {
          'type': 'geojson',
          'data': hData
        });
      this.map.addLayer({
        'id': 'highlightLabels2',
        'type': 'symbol',
        'source': 'highlightLabels2',
        'layout': {
          'text-field': ['get', 'name'],
          "text-size": 16
        }
      });
    }
    const filter = ['in', ['get', 'id'], ['literal', [-1]]];
    this.map.addLayer({
      'id': this.layers[this.selectedLayer].name,
      'type': 'fill',
      'source': this.layers[this.selectedLayer].name,
      'source-layer': this.layers[this.selectedLayer].name,
      'paint': this.mapStyles.bins,
      'filter': filter
    });
    this.map.addLayer({
      'id': 'highlight',
      'type': 'line',
      'source': this.layers[this.selectedLayer].name,
      'source-layer': this.layers[this.selectedLayer].name,
      'paint': this.mapStyles.highlight,
      'filter': filter
    });
    this.previousLayerName = this.layers[this.selectedLayer].name;
    if (params) {
      this.retrieveStatements(params);
    }
  }
  handleControls = () => {
    this.map.on('click', (e) => {
      this.retrieveStatements(undefined, e);
    });

    // Add navigation controls to the top right of the canvas
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('zoomend', () => {
      let layerName = this.layers[this.selectedLayer].name;
      if (layerName.includes('bins') && layerName.slice(-1) !== this.getBinVersion()) {
        this.setSearch({ scale: 'bins' });
      }
    });

    if (!('remove' in Element.prototype)) {
      Element.prototype.remove = function () {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      };
    }
  }
  componentDidMount() {

    mapboxgl.accessToken =
      '***REMOVED***';

    // this.mapbox functionality goes here
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v9',
      center: [this.lng, this.lat],
      zoom: this.zoom,
      bearing: this.bearing,
      pitch: this.pitch,
      maxZoom: this.maxZoom
    });

    this.map.on('load', () => {
      this.handleLayers();
      this.handleControls();
      this.setSearch({});
    });
  }

  rowGetter = ({ index }) => this.state.statementsTableRows[index];
  handleTabChange = (event, newTabValue) => {
    if (newTabValue !== this.state.tabValue) {
      this.setState({ 'tabValue': newTabValue });
    }
  };
  a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  render() {
    const { classes } = this.props;
    const muiTheme = createMuiTheme({
      palette: { primary: lightBlue },
      overrides: {
        MuiToggleButton: {
          root: {
            "&.MuiToggleButton-root": {
              backgroundColor: 'rgba(0, 0, 0, 0)'
            },
            "&.MuiToggleButton-root.Mui-selected:hover": {
              backgroundColor: '#ebf3fa'
            },
            "&.MuiToggleButton-root:hover": {
              backgroundColor: '#ebf3fa'
            },
            "&.Mui-selected": {
              backgroundColor: '#ebf3fa'
            }
          }
        }
      }
    })
    const truncateLength = 500;
    const truncate = (str) => {
      return (str.length > truncateLength) ? str.substr(0, truncateLength - 1) + '…' : str;
    };
    const statementColumns = [
      {
        label: 'Statement',
        dataKey: 'content',
        renderCell: (params) => (
          <div style={{ 'height': '100%', 'width': '100%' }}>
            {truncate(params.value)}
          </div>
        )
      },
      {
        label: 'Published',
        dataKey: 'published',
      }
    ];
    if (!this.production) {
      statementColumns[0].width = 316;
      statementColumns.push(
        {
          width: 24,
          label: '',
          dataKey: 'statementId',
          renderCell: (params) => (
            <div>
              <IconButton size={"small"}
                onClick={(e) => { this.handleMovementClick(e, params.value, 'y') }}
                className={this.statementButtonStyles[params.value + '_y']}>
                <CheckCircleOutlineIcon aria-label="movement" />
              </IconButton>
              <IconButton size={"small"}
                onClick={(e) => { this.handleMovementClick(e, params.value, 'x') }}
                className={this.statementButtonStyles[params.value + '_x']}>
                <CancelIcon aria-label="not movement" />
              </IconButton>
            </div>
          )
        }
      );
    }
    return (
      <Grid container spacing={1} style={{ 'height': '100%' }}>
        <Grid item xs={9}>
          <div className="mapContainer" ref={el => this.mapContainer = el} />
          <canvas id="deck-canvas"></canvas>
        </Grid>
        <Grid item xs={3} >
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <AutoComplete
                        facadeBaseUrl={this.facadeBaseUrl}
                        searchType={this.elasticSuggestRequest}
                        channels={this.state.channels}
                        setSearch={this.setSearch} />
                    </Grid>
                    <Grid item xs={12}>
                      <CustomizedSlider
                        timeMarks={this.timeMarks}
                        setSearch={this.setSearch} />
                    </Grid>
                    <Grid item xs={12} height={200}>
                      <TornadoChartPane
                        tornadoData={this.state.tornadoData}
                        key={this.state.tornadoUpdate} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={6}>
                  <Grid container spacing={2}>
                    <ThemeProvider theme={muiTheme}>
                      <Grid item xs={12}>
                        <ChannelChooser
                          channels={this.state.channels}
                          setSearch={this.setSearch}
                          filterButton={classes.filterButton}
                          filterImg={classes.filterImg} />
                      </Grid>
                      <Grid item xs={12}>
                        <NegationChooser setSearch={this.setSearch}
                          negation={this.state.negation}
                          filterButton={classes.filterButton}
                          filterImg={classes.filterImg} />
                      </Grid>
                      <Grid item xs={12}>
                        <ScaleChooser setSearch={this.setSearch}
                          scale={this.state.scale}
                          filterButton={classes.filterButton}
                          filterImg={classes.filterImg}
                          setClassBreak={this.setClassBreak}
                          binClasses={this.state.binClasses} />
                      </Grid>
                    </ThemeProvider>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} style={{ 'height': '100%' }}>
              <Paper className={classes.resultsPaper} >
                <SimpleTabs
                  production={this.production}
                  statementsTableRows={this.state.statementsTableRows}
                  rowCount={this.state.statementsTableRows.length}
                  statementButtonStyles={this.statementButtonStyles}
                  notChosenStyle={classes.notChosen}
                  chosenXStyle={classes.chosenX}
                  chosenYStyle={classes.chosenY}
                  geomovementLabelUpdateUrl={this.geomovementLabelUpdateUrl}
                  statementColumns={statementColumns}
                  bigramsTableRows={this.state.bigramsTableRows}
                  removeBigram={this.removeBigram}
                  textSummaryClassesGrid={classes.textSummaryClassesGrid}
                  textClassesRow={classes.textClassesRow}
                  bikey={this.state.bigramUpdate}>
                </SimpleTabs>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid >
    );
  }
}

export default withStyles(styles)(MainApp);
