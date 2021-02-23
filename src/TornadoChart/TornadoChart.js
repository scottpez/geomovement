import React from "react";
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import * as d3 from "d3";
import './styles.scss';

class TornadoChartPane extends React.Component {

    createTornadoChart() {


        this.margin = { top: 2, right: 2, bottom: 2, left: 40 };
        this.width = this.node.clientWidth - this.margin.left - this.margin.right;
        this.height = this.node.clientHeight - this.margin.top - this.margin.bottom;
        this.handleMouseOver = (d, i) => {
            this.svg2.attr("visibility", "visible");
        };
        this.handleMouseOut = (d, i) => {
            this.svg2.attr("visibility", "hidden");
        };

        this.svg = d3.select(this.node)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        const tornadoData = this.props.tornadoData;

        let x = d3.scaleLinear()
            .range([0, this.width]);

        let y = d3.scaleBand()
            .rangeRound([0, this.height])
            .padding(0.1);

        let xAxis = d3.axisBottom(x)
            .tickSize(0)
            .tickFormat("");

        let yAxis = d3.axisLeft(y)
            .tickSize(0)
            .tickFormat("");

        x.domain(d3.extent(tornadoData, function (d) { return d.count; })).nice();
        y.domain(tornadoData.map(function (d) { return d.date; }));

        this.drawBars = (ele, myData) => {
            let bar = ele.selectAll(".bar")
                .data(myData);

            bar.enter().append("rect")
                .attr("class", function (d) {
                    let type = '';
                    switch (d.t) {
                        case 'tm':
                            type = 'tmovement';
                            break;
                        case 'tnm':
                            type = 'tnomovement';
                            break;
                        case 'fm':
                            type = 'fmovement';
                            break;
                        case 'fnm':
                            type = 'fnomovement';
                            break;
                        default:
                            break;
                    }
                    return "bar bar--" + type;
                })
                .attr("x", function (d) {
                    let count = d.count;
                    if (d.t === 'tnm' || d.t === 'fnm') {
                        count = -count;
                    }
                    return x(Math.min(0, count));
                })
                .attr("y", function (d) { return y(d.date); })
                .attr("width", function (d) {
                    let count = d.count;
                    if (d.t === 'tnm' || d.t === 'fnm') {
                        count = -count;
                    }
                    return Math.abs(x(count) - x(0));
                })
                .attr("height", y.bandwidth())
                .attr("visibility", "inherit");

            bar.enter().append('text')
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    let count = d.count;
                    if (d.t === 'tnm' || d.t === 'fnm') {
                        count = -count;
                    }
                    return x(Math.min(0, count)) + (Math.abs(x(count) - x(0)) / 2);
                })
                .attr("y", function (d, i) {
                    return y(d.date) + (y.bandwidth() / 2);
                })
                .attr("dy", ".35em")
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.t === 'fm' || d.t === 'fnm') {
                        return d.count;
                    } else {
                        return;
                    }
                })
                .attr("visibility", "inherit");

            let max = 0;
            for (let i = 0; i < myData.length; i++) {
                let d = myData[i];
                let tempMax = x(Math.min(0, d.count)) + (Math.abs(x(d.count) - x(0)) / 1.25);
                if (tempMax > max) {
                    max = tempMax;
                }
            }
            bar.enter().append('text')
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    return max;
                })
                .attr("y", function (d, i) {
                    return y(d.date) + (y.bandwidth() / 2);
                })
                .attr("dy", ".35em")
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .text(function (d) {
                    if (d.t === 'tm') {
                        return d.date;
                    } else {
                        return;
                    }
                });
        };

        this.drawBars(this.svg, tornadoData);
        this.bottomrect = this.svg.append("rect")
            .attr("class", "nobox")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("x", -this.margin.left)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(xAxis);

        this.svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ",0)")
            .call(yAxis);

        this.svg2 = d3.select(this.node)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("x", -this.margin.left)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .attr("visibility", "hidden");

        this.svg2.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(xAxis);

        this.svg2.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ",0)")
            .call(yAxis);

        this.svg2.append("rect")
            .attr("class", "clearbox")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("x", -this.margin.left)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        let filteredTornadoData = [];
        for (let i = 0; i < tornadoData.length; i++) {
            if (tornadoData[i].t === 'fm' || tornadoData[i].t === 'fnm') {
                filteredTornadoData.push(tornadoData[i]);
            }
        }
        x.domain(d3.extent(filteredTornadoData, function (d) { return d.count; })).nice();
        this.drawBars(this.svg2, filteredTornadoData);

        this.bottomrect
            .on("mouseover", this.handleMouseOver)
            .on("mouseout", this.handleMouseOut);

    }

    componentDidMount() {
        this.createTornadoChart();
    }

    render() {
        return (
            <Typography component="div">
                <Box fontWeight="fontWeightBold">Negation of Movement Summary</Box>
                <svg id="chart" ref={node => this.node = node} />
            </Typography>
        );
    }

}
export default TornadoChartPane;