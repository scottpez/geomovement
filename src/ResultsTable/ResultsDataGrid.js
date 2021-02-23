import React from 'react';
import { DataGrid } from '@material-ui/data-grid';
import "./styles.scss";

export default function ResultsDataGrid(props) {
    let contentWidth = 390;
    if (!props.production && false) {
        contentWidth = 350;
    }
    let columns = [
        {
            field: 'contentHTML', headerName: 'Statement', width: contentWidth, renderCell: (params) => (
                <div onClick={(e) => {
                    if (e.ctrlKey) {
                        window.open(params.value.split('::::')[0], '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
                    }
                }} >
                    {params.value.split('::::')[1]}
                </div>
            )
        },
        { field: 'published', headerName: 'Published', width: 80 }];
    const { statementsTableRows } = props;
    if (!props.production && false) {
        columns.push({ field: 'statementId', headerName: ' ', width: 10 });
    }

    return (
        <div id="r_dg_div" style={{ height: '100%', width: '100%' }}>
            <DataGrid pagination
                size="small"
                rows={statementsTableRows}
                columns={columns}
                autoHeight={true}
                rowHeight={40}
                headerHeight={30}
                pageSize={13}
                hideFooter={false}
                disableSelectionOnClick={true}
                sortingMode={'server'}
                paginationMode={'client'} />
        </div>
    );
};