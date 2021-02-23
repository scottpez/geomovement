import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ContinentIcon from './continent.svg';
import CountryIcon from './country.svg';
import StateIcon from './state.svg';
import HexIcon from './hex.svg';
import './styles.scss';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import TextSizeTooltip from '../CustomComponents/CustomTooltip';
import MyToggleButton from '../CustomComponents/CustomToggleButton';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles({
    root: {
        '&:hover': {
            backgroundColor: 'transparent',
        },
        padding: 3
    },
    icon: {
        borderRadius: '50%',
        width: 13,
        height: 13,
        boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
        backgroundColor: '#f5f8fa',
        backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
        '$root.Mui-focusVisible &': {
            outline: '2px auto rgba(19,124,189,.6)',
            outlineOffset: 2,
        },
        'input:hover ~ &': {
            backgroundColor: '#ebf1f5',
        },
        'input:disabled ~ &': {
            boxShadow: 'none',
            background: 'rgba(206,217,224,.5)',
        },
    },
    checkedIcon: {
        backgroundColor: '#137cbd',
        backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
        '&:before': {
            display: 'block',
            width: 13,
            height: 13,
            backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
            content: '""',
        },
        'input:hover ~ &': {
            backgroundColor: '#106ba3',
        },
    },
});

function StyledRadio(props) {
    const classes = useStyles();

    return (
        <Radio
            className={classes.root}
            disableRipple
            color="default"
            checkedIcon={<span className={clsx(classes.icon, classes.checkedIcon)} />}
            icon={<span className={classes.icon} />}
            {...props}
        />
    );
}

const useStyles2 = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
        },
        '& .MuiFormLabel-root': {
            fontSize: 10,
            transform: 'translate(0, 1.5px) scale(1.0);'
        },
        '& .MuiInputBase-input': {
            padding: 1
        },
        '& .MuiFormHelperText-root': {
            fontSize: 10
        }
    },
}));

function StyledTextField(props) {
    const classes = useStyles2();

    return (
        <form className={classes.root} noValidate autoComplete="off">
            <TextField {...props} />
        </form>
    );
}

function ScaleChooser(props) {
    const [scale, setScale] = React.useState(() => props.scale);
    const [binClasses, setBinClasses] = React.useState(() => props.binClasses);

    const handleScaleChange = (event, newScale) => {
        if (newScale &&
            scale !== newScale &&
            !(scale.includes('bins') && newScale.includes('bins'))) {
            setScale(newScale);
            props.setSearch({ scale: newScale });
        }
    }

    const handleClassBreakChange = (event, newBinClassType) => {
        if (newBinClassType &&
            binClasses.type !== newBinClassType) {
            let newBinClasses = binClasses;
            newBinClasses.type = newBinClassType;
            setBinClasses(newBinClasses);
            props.setClassBreak(newBinClasses);
        }
    }
    const handleClassBreakNumberChange = (event) => {
        if (event.target.value !== '') {
            let newBinClassNumber = parseInt(event.target.value);
            if (binClasses.numClasses !== newBinClassNumber) {
                let newBinClasses = binClasses;
                newBinClasses.numClasses = newBinClassNumber;
                setBinClasses(newBinClasses);
                props.setClassBreak(newBinClasses);
            }
        }
    }

    const textSubmitHandler = (e) => {
        e.preventDefault();
    }

    return (
        <Typography component="div">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box fontWeight="fontWeightBold">Location Grouping Scale</Box>
                    <FormControl component="fieldset">
                        <ToggleButtonGroup value={scale} exclusive={true} onChange={handleScaleChange}>
                            <TextSizeTooltip title="Continent" placement="top-start">
                                <MyToggleButton value="continents" selected={scale === 'continents'}
                                    myclassname={props.filterButton}>
                                    <img src={ContinentIcon} className={props.filterImg} alt={'Continent'} />
                                </MyToggleButton>
                            </TextSizeTooltip>
                            <TextSizeTooltip title="Country" placement="top">
                                <MyToggleButton value="countries" selected={scale === 'countries'}
                                    myclassname={props.filterButton}>
                                    <img src={CountryIcon} className={props.filterImg} alt={'Country'} />
                                </MyToggleButton>
                            </TextSizeTooltip>
                            <TextSizeTooltip title="State" placement="top">
                                <MyToggleButton value="states" selected={scale === 'states'}
                                    myclassname={props.filterButton}>
                                    <img src={StateIcon} className={props.filterImg} alt={'ConStatetinent'} />
                                </MyToggleButton>
                            </TextSizeTooltip>
                            <TextSizeTooltip title="Hex Bins" placement="top-end">
                                <MyToggleButton value="bins" selected={scale.includes('bins')}
                                    myclassname={props.filterButton}>
                                    <img src={HexIcon} className={props.filterImg} alt={'Hex Bins'} />
                                </MyToggleButton>
                            </TextSizeTooltip>
                        </ToggleButtonGroup>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Box fontWeight="fontWeightBold">Location Grouping Class Breaks</Box>
                    <FormControl component="fieldset" onSubmit={textSubmitHandler}>
                        <RadioGroup defaultValue="jenks" aria-label="gender" name="customized-radios" onChange={handleClassBreakChange}>
                            <FormControlLabel value="jenks" control={<StyledRadio />} label="Jenks Natural Breaks" />
                            <FormControlLabel value="eqInterval" control={<StyledRadio />} label="Equal Interval" />
                            <FormControlLabel value="stdDeviation" control={<StyledRadio />} label="Standard Deviation" />
                            <FormControlLabel value="arithmeticProgression" control={<StyledRadio />} label="Arithmetic Progression" />
                            <FormControlLabel value="quantile" control={<StyledRadio />} label="Quantile" />
                        </RadioGroup>
                        <StyledTextField required id="standard-basic" label="Number of Classes" defaultValue="5"
                            error={(binClasses.numClasses >= 2 && binClasses.numClasses <= 7) ? false : true} helperText="Value from 2 to 7" onChange={handleClassBreakNumberChange} />
                    </FormControl>
                </Grid>
            </Grid>
        </Typography>
    )
}

export default ScaleChooser;
