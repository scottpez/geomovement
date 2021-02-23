import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import NewsIcon from './newsIcon.svg';
import TwitterIcon from './twitterIcon.svg';
import ScienceIcon from './scienceIcon.svg';
import './styles.scss';
import MyToggleButton from '../CustomComponents/CustomToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import TextSizeTooltip from '../CustomComponents/CustomTooltip';

export default function ChannelChooser(props) {
    const [channels, setChannels] = React.useState(() => props.channels);

    const handleChannelChange = (event, newChannels) => {
        if (newChannels) {
            setChannels(newChannels);
            props.setSearch({ channels: newChannels });
        }
    }

    return (
        <Typography component="div">
            <Box fontWeight="fontWeightBold">Statement Source</Box>
            <FormControl component="fieldset">
                <ToggleButtonGroup value={channels} exclusive={false} onChange={handleChannelChange}>
                    <TextSizeTooltip title="News Articles" placement="top-start">
                        <MyToggleButton value="news" selected={channels.some(x => x === 'news')}
                            myclassname={props.filterButton}>
                            <img src={NewsIcon} className={props.filterImg} alt={'News Articles'} />
                        </MyToggleButton>
                    </TextSizeTooltip>
                    <TextSizeTooltip title="Twitter" placement="top">
                        <MyToggleButton value="tweets" selected={channels.some(x => x === 'tweets')}
                            myclassname={props.filterButton}>
                            <img src={TwitterIcon} className={props.filterImg} alt={'Tweets'} />
                        </MyToggleButton>
                    </TextSizeTooltip>
                    <TextSizeTooltip title="Scientific Articles" placement="top-end">
                        <MyToggleButton value="science" selected={channels.some(x => x === 'science')}
                            myclassname={props.filterButton}>
                            <img src={ScienceIcon} className={props.filterImg} alt={'Scientific Articles'} />
                        </MyToggleButton>
                    </TextSizeTooltip>
                </ToggleButtonGroup>
            </FormControl>
        </Typography>
    )
}
