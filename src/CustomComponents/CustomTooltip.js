import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

const TextSizeTooltip = withStyles({
  tooltip: {
    fontSize: 10
  }
})(Tooltip);

export default TextSizeTooltip;