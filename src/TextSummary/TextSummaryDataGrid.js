import React from 'react';
import { DataGrid } from '@material-ui/data-grid';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import "./styles.scss";

export default function TextSummaryDataGrid(props) {
    const columns = [
        { field: 'bigram', headerName: 'Bigram', width: 140 },
        { field: 'count', headerName: 'Count', type: 'number', width: 50 }];
    const { textSummaryClassesGrid, textSummaryClassesRow } = props;
    let numRows = 10;
    let clickTimer, lastRowCLickedId;
    const handleDoubleClick = (e, binName) => {
        if (clickTimer && lastRowCLickedId === e.rowIndex) {
            clearTimeout(clickTimer);
            clickTimer = null;
            lastRowCLickedId = e.rowIndex;
            props.removeBigram(e.data.id, binName);
        } else {
            clickTimer = setTimeout(function () { }, 250);
        }

        lastRowCLickedId = e.rowIndex;
    };
    // useEffect(() => {
    //     let mytables = [];
    //     for (let i = 0; i < keys.length; i++) {
    //         const binName = keys[i];
    //         mytables.push(<Grid key={binName + '_g'} item xs={4}>
    //             <div id="ts_dg_div" style={{ height: '100%', width: '100%' }}>
    //                 <Typography key={binName + '_t'} width={'100%'} align='center' variant='h5'>{binName}</Typography>
    //                 <DataGrid key={binName + '_dg'} rows={bigramsTableRows[binName]} columns={columns}
    //                     className={textSummaryClassesRow}
    //                     autoHeight={true}
    //                     pageSize={numRows}
    //                     rowHeight={25} headerHeight={0} hideFooter={true}
    //                     disableSelectionOnClick={true}
    //                     onRowClick={(event) => handleDoubleClick(event, binName)} />
    //             </div>
    //         </Grid>);
    //     }
    // })

    return (
        <Grid container spacing={1} className={textSummaryClassesGrid} >
            {
                Object.keys(props.bigramsTableRows).map((binName) => (
                    <Grid key={binName + '_g'} item xs={6}>
                        <div id="ts_dg_div" style={{ height: '150px', width: '100%' }}>
                            <Typography key={binName + '_t'} width={'100%'} align='center' variant='h5'>{binName}</Typography>
                            <DataGrid key={binName + '_dg'} rows={props.bigramsTableRows[binName]} columns={columns}
                                className={textSummaryClassesRow}
                                autoHeight={true}
                                pageSize={numRows}
                                rowHeight={25} headerHeight={0} hideFooter={true}
                                disableSelectionOnClick={true}
                                onRowClick={(event) => handleDoubleClick(event, binName)} />
                        </div>
                    </Grid>
                ))
            }
        </Grid >
    );
};