import React, { forwardRef } from 'react';
import classNames from "classnames";
import ToggleButton from '@material-ui/lab/ToggleButton';

const MyToggleButton = forwardRef((props, ref) => {
    const { className, myclassname } = props;
    return <ToggleButton ref={ref} {...props}
        className={classNames(className, myclassname)} selected={props.selected}>
        {props.children}
    </ToggleButton>;
});
export default MyToggleButton;