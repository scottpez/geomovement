import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import NoMovementIcon from './noMovementIcon.svg';
import MovementIcon from './movementIcon.svg';
import './styles.scss';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import TextSizeTooltip from '../CustomComponents/CustomTooltip';
import MyToggleButton from '../CustomComponents/CustomToggleButton';

function NegationChooser(props) {
    const [negation, setNegation] = React.useState(() => props.negation);

    const handleNegationChange = (event, newNegation) => {
        if (newNegation) {
            setNegation(newNegation);
            props.setSearch({ negation: newNegation });
        }
    }

    return (
        <Typography component="div">
            <Box fontWeight="fontWeightBold">Negation of Movement</Box>
            <FormControl component="fieldset">
                <ToggleButtonGroup value={negation} exclusive={false} onChange={handleNegationChange}>
                    <TextSizeTooltip title="Movement" placement="top-start">
                        <MyToggleButton value="movement" selected={negation.some(x => x === 'movement')}
                            myclassname={props.filterButton}>
                            <img src={MovementIcon} className={props.filterImg} alt={'Movement'} />
                        </MyToggleButton>
                    </TextSizeTooltip>
                    <TextSizeTooltip title="Negated Movement" placement="top">
                        <MyToggleButton value="nomovement" selected={negation.some(x => x === 'nomovement')}
                            myclassname={props.filterButton}>
                            <img src={NoMovementIcon} className={props.filterImg} alt={'Negated Movement'} />
                        </MyToggleButton>
                    </TextSizeTooltip>
                </ToggleButtonGroup>
            </FormControl>
        </Typography>
    )
}

export default NegationChooser;