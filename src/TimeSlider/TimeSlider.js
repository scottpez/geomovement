import React from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
    root: {
        width: '97%',
        marginTop: 15
    },
    type: {
        fontFamily: 'Roboto',
        color: '#777',
        fontSize: 13,
        opacity: 1
    },
    margin: {
        height: theme.spacing(3),
    },
    tooltip: {
        fontSize: 12
    }
});

class CustomizedSlider extends React.Component {

    ValueLabelComponent = (props) => {
        const { children, value } = props;
        const { classes } = this.props;

        this.label = ''
        this.props.timeMarks.forEach(mark => {
            if (mark.value === value) {
                this.label = mark.tooltip;
            }
        })

        return (
            <Tooltip classes={{
                tooltip: classes.tooltip
            }} open={true} placement="top" title={this.label} >
                {children}
            </Tooltip>
        );
    }

    handleChange = (event, newValue) => {
        this.props.setSearch({ timeRange: newValue });
    }

    render() {

        const { classes } = this.props;

        this.ValueLabelComponent.propTypes = {
            children: PropTypes.element.isRequired,
            value: PropTypes.number.isRequired,
        }

        return (
            <Typography component="div" className={classes.root}>
                <Box fontWeight="fontWeightBold">Time Search</Box>
                <Slider
                    ValueLabelComponent={this.ValueLabelComponent}
                    defaultValue={[0, 11]}
                    min={0}
                    max={17}
                    step={1}
                    onChangeCommitted={this.handleChange}
                    marks={this.props.timeMarks}
                >
                </Slider>
            </Typography>
        );
    }

}
export default withStyles(styles)(CustomizedSlider);