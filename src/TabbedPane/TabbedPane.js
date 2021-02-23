import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ResultsDataGrid from '../ResultsTable/ResultsDataGrid';
import TextSummaryDataGrid from '../TextSummary/TextSummaryDataGrid';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography component={'div'}>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}
const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%'
    },
    tab: {
        '& .MuiBox-root': {
            height: '100%',
            paddingTop: '5px',
            paddingRight: '0px',
            paddingLeft: '0px',
            paddingBottom: '0px',
        },
    },
}));

export default function SimpleTabs(props) {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const { textSummaryClassesGrid, textClassesRow, resultsClassesGrid,
        statementsTableRows, geomovementLabelUpdateUrl } = props;

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <AppBar position="static" color="default">
                <Tabs value={value} onChange={handleChange} indicatorColor="primary"
                    textColor="primary" aria-label="tabs">
                    <Tab label="Key Terms" {...a11yProps(0)} classes={{ root: classes.tab }} />
                    <Tab label="Statements" {...a11yProps(1)} classes={{ root: classes.tab }} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0} className={classes.tab} >
                <TextSummaryDataGrid
                    key={props.bikey}
                    bigramsTableRows={props.bigramsTableRows}
                    removeBigram={props.removeBigram}
                    textSummaryClassesGrid={textSummaryClassesGrid}
                    textClassesRow={textClassesRow} />
            </TabPanel>
            <TabPanel value={value} index={1} className={classes.tab} >
                <ResultsDataGrid
                    production={props.production}
                    resultsClassesGrid={resultsClassesGrid}
                    textClassesRow={textClassesRow}
                    geomovementLabelUpdateUrl={geomovementLabelUpdateUrl}
                    statementsTableRows={statementsTableRows}
                    columns={props.statementColumns}
                />
            </TabPanel>
        </div>
    );
}