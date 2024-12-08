const QuickChartPlugin = (function() {
    let cachedData = null;
    let columns = {};
    let params = {x: '', y: [], y2: [], type: 'line', stack: false, cat_x: false, labels: false};
    let chart = null;
    let help = {
        'line': 'To build a line chart, select X and at least one of Y or Y2.',
        'bar': 'To build a bar chart, select X and at least one of Y or Y2.',
        'scatter': 'To build a scatter chart, select X and at least one of Y or Y2.',
        'area': 'To build a area chart, select X and at least one of Y or Y2.',
        'pie': 'To build a pie chart, select X and one and only one of Y.',
    }

    function appendQueryString(url, qs) {
        const op = url.includes('?') ? '&' : '?';
        return url+op+qs
    }

    async function fetchData() {
        const jsonUrl = document.querySelector('link[rel="alternate"][type="application/json+datasette"]').href;
        const dataUrl = appendQueryString(jsonUrl, '_shape=array&_size=max');
        const resp = await fetch(dataUrl);
        cachedData = await resp.json();
        columns = getColumns(cachedData);
    }

    function loadParams() {
        const jsonString = sessionStorage.getItem('datasette-quickchart-params');
        let data;
        if (jsonString) {
            try {
                data = JSON.parse(jsonString);
            } catch {
                data = {};
            }
        }
        params.x = (data.x in columns) ? data.x : '';
        for (const par of ['y', 'y2']) {
            const cols = data[par] || [];
            params[par] = cols.filter(col => columns.hasOwnProperty(col));
        }
        params.type = data.t || 'line';
        params.stack = data.st || false;
        params.cat_x = data.cx || false;
        params.labels = data.lb || false;
    }

    function saveParams() {
        sessionStorage.setItem('datasette-quickchart-params', JSON.stringify(params));
    }

    function updateParamsFromForms() {
        const tracesForm = document.getElementById('qc-traces');
        const traces = new FormData(tracesForm);
        params.x = traces.get('x') || '';
        for (const par of ['y', 'y2']) {
            params[par] = traces.getAll(par);
        }
        const configForm = document.getElementById('qc-config');
        const formData = new FormData(configForm);
        params.type = formData.get('type');
        params.stack = formData.get('stack') == '1';
        params.cat_x = formData.get('cat_x') == '1';
        params.labels = formData.get('labels') == '1';
    }

    function getInput(name, type, value, checked) {
        const extra = checked ? ' checked' : '';
        return `<input name="${name}" type="${type}" value="${value}"${extra} />`;
    }

    function td(html) {
        return `<td>${html}</td>`;
    }

    function ucfirst(s) {
        return s.charAt(0).toUpperCase() + s.substring(1);
    }

    function typeName(type) {
        return (type == 'time') ? 'Date/Time' : ucfirst(type);
    }

    function getTracesForm() {
        var html = '<table>';
        html += '<tr><th>Column</th><th>X</th><th>Y</th><th>Y2</th><th>Axis type</td></tr>';
        for (const [name, type] of Object.entries(columns)) {
            html += '<tr>' + td(name);
            html += td((type == 'null') ? '' : getInput('x', 'radio', name, name==params.x));
            if (type == 'numeric') {
                html += td(getInput('y', 'checkbox', name, params.y.includes(name)));
                html += td(getInput('y2', 'checkbox', name, params.y2.includes(name)));
            } else {
                html += '<td></td><td></td>';
            }
            html += td(typeName(type)) + '</tr>';
        }
        html += '</table>';
        return html;
    }

    function getConfigForm() {
        var html = '<table><tr>';
        html += '<td><label>' + getInput('type', 'radio', 'line', params.type=='line') + ' Line</label></td>';
        html += '<td><label>' + getInput('type', 'radio', 'scatter', params.type=='scatter') + ' Scatter</label></td>';
        html += '<td><label>' + getInput('type', 'radio', 'area', params.type=='area') + ' Area</label></td>';
        html += '<td><label>' + getInput('type', 'radio', 'bar', params.type=='bar') + ' Bar</label></td>';
        html += '<td><label>' + getInput('type', 'radio', 'pie', params.type=='pie') + ' Pie</label></td>';
        html += '<td class="sep"></td>';
        html += '<td><label title="Show data labels">' + getInput('labels', 'checkbox', '1', params.cat_x) + ' Labels</label></td>';
        html += '<td><label title="Stacked chart">' + getInput('stack', 'checkbox', '1', params.stack) + ' Stacked</label></td>';
        html += '<td><label title="Treat X data as labels">' + getInput('cat_x', 'checkbox', '1', params.cat_x) + ' Categorical X</label></td>';
        html += '</tr></table>';
        return html;
    }

    function setConfigFormClasses() {
        classes = [];
        if (params.type == 'bar') {
            classes.push('show-st');
        }
        if ((params.type != 'pie') && (params.x > '') && (columns[params.x] != 'categorical')) {
            classes.push('show-cx');
        }
        const form = document.getElementById('qc-config');
        form.classList = classes.join(' ');
    }

    function isValidDate(val) {
        return Date.parse(val) > 0;
    }

    function valType(val) {
        const t = typeof val;
        if (t == 'number') {
            return 'numeric'
        } else if (t == 'string') {
            return isValidDate(val) ? 'time' : 'categorical';
        }
        return 'null';
    }

    function getColumns(data) {
        const columns = {};
        for (const row of data) {
            for (const [key, val] of Object.entries(row)) {
                const newType = valType(val);
                if (key in columns) {
                    const oldType = columns[key];
                    if ((newType != oldType) && (newType != 'null') && (oldType != 'categorical')) {
                        columns[key] = (oldType == 'null') ? newType : 'categorical';
                    }
                } else {
                    columns[key] = newType;
                }
            }
        }
        return columns;
    }

    function isStackable() {
        return (params.type == 'bar') && ((params.y.length > 1) || (params.y2.length > 1));
    }

    function getContent() {
        var html = '<div id="qc-left">';
        html += '<form id="qc-traces">' + getTracesForm() + '</form>';
        html += '</div>';
        html += '<div id="qc-right">';
        html += '<form id="qc-config">' + getConfigForm() + '</form>';
        html += '<div id="qc-chart"></div></div>';
        return html;
    }

    function oneInRow(ev) {
        const input = ev.target;
        if (input.checked) {
            const inputs = input.closest('tr').querySelectorAll('input');
            for (const other of inputs) {
                if (other !== input) {
                    other.checked = false;
                }
            }
        }
    }

    function addEventListeners() {
        const tracesForm = document.getElementById('qc-traces');
        const tracesFormInputs = tracesForm.querySelectorAll('tr input');
        for (const input of tracesFormInputs) {
            input.addEventListener('change', oneInRow);
        }
        const configForm = document.getElementById('qc-config');
        for (form of [tracesForm, configForm]) {
            form.addEventListener('change', (ev) => {
                updateParamsFromForms();
                setConfigFormClasses();
                //configForm.dataset.type = params.type;
                //configForm.classList.toggle('stackable', isStackable());
                saveParams();
                updateChart();
            });
        }
    }

    function chartMessage(text) {
        const node = document.getElementById('qc-chart');
        node.innerHTML = text;
    }

    function readyToPlot() {
        if (params.x == '') {
            return false;
        }
        if (params.type.includes('pie')) {
            return (params.y.length == 1) && (params.y2.length == 0);
        }
        /*
        if (params.type == 'ohlc') {
            return (params.o > '') && (params.h > '') && (params.l > '') && (params.c > '');
        }
        */
        return (params.y.length > 0) || (params.y2.length > 0);
    }

    function getSortedData(sortCol) {
        if (columns[sortCol] == 'time') {
            return [...cachedData].sort((a, b) => a[sortCol].localeCompare(b[sortCol]));
        }
        return [...cachedData].sort((a, b) => a[sortCol] - b[sortCol]);
    }

    function allInt(data, col) {
        for (row of data) {
            if (!Number.isInteger) {
                return false;
            }
        }
        return true;
    }

    /*
    function aggregatedData(xCol, yCols) {
        const agg = {};
        for (const row of cachedData) {
            const x = row[xCol];
            let obj = agg[x];
            if (obj == null) {
                obj = Object.fromEntries(yCols.map(col => [col, 0]));
                obj[xCol] = x;
                agg[x] = obj;
            }
            for (const col of yCols) {
                obj[col] += row[col] || 0;
            }
        }
        return Object.values(agg);
    }
    */

    function pieData(labelCol, valueCol, aggregate) {
        const data = {};
        for (const row of cachedData) {
            const label = row[labelCol];
            const value = Math.abs(row[valueCol] || 0);
            if (label in data) {
                data[label] += value;
            } else {
                data[label] = value;
            }
        }
        for (let key in data) {
            if (data[key] == 0) {
                delete data[key];
            }
        }
        return {
            labels: Object.keys(data),
            values: Object.values(data)
        }
    }

    function toApexType(colType) {
        return (colType == 'time') ? 'datetime' : (colType == 'numeric') ? 'numeric' : 'category';
    }

    async function updateChart() {
        if (!readyToPlot()) {
            chartMessage(help[params.type]);
            return;
        }

        const compactFormatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short'
        });

        const formatter = new Intl.NumberFormat('en-US');

        const intFormatter = new Intl.NumberFormat('en-US', {maximumFractionDigits: 0});

        const options = {
            chart: {
                type: params.type,
                height: 'auto',
                stacked: params.stack,
                toolbar: { show: true }
            },
            dataLabels: {
                enabled: params.labels,
                style: {
                    fontWeight: 'normal'
                }
            },
            theme: { //3, 6, 7
                palette: 'palette7'
            },
            tooltip: {
                y: {
                    formatter: formatter.format
                }
            },
            series: [],
            xaxis: {
                type: 'categorical', //(columns[params.x]),
                categories: []
            },
            yaxis: [],
            labels: []
        };
        if (params.y.length > 0) {
            options.yaxis.push({});
        }
        if (params.y2.length > 0) {
            options.yaxis.push({opposite: true});
        }
        for (yaxis of options.yaxis) {
            yaxis['labels'] = {formatter: compactFormatter.format};
        }
        if (params.type === 'pie') {
            const valCol = params.y[0];
            const data = pieData(params.x, valCol);
            options.series = data.values;
        } else {
            const data = columns[params.x] == 'categorical' ? cachedData : getSortedData(params.x);
            if ((columns[params.x] == 'numeric') && allInt(data, params.x)) {
                options.xaxis.labels = {
                    formatter: intFormatter.format
                };
            }
            options.xaxis.categories = data.map(row => row[params.x]);
            for (const y of params.y) {
                options.series.push({
                    name: y,
                    data: data.map(row => row[y]),
                    yaxis: 1
                });
            }
            for (const y2 of params.y2) {
                options.series.push({
                    name: y2,
                    data: data.map(row => row[y2]),
                    yaxis: 2
                });
            }
            if (options.yaxis.length > 1) {
                options.yaxis[0].title = {text: params.y.join(' | '), style: {fontWeight: 400}};
                options.yaxis[1].title = {text: params.y2.join(' | '), style: {fontWeight: 400}, rotate:90};
            }
        }
        console.log(options);
        /*
         * doesn't work :(
         *
        if (chart == null) {
            const chartDiv = document.getElementById('qc-chart');
            //chartDiv.innerHTML = '';
            chart = new ApexCharts(chartDiv, options);
            chart.render();
        } else {
            chart.updateOptions(options, true);
            //chart.render();
        }
        */
        if (chart != null) {
            chart.destroy();
        }
        const chartDiv = document.getElementById('qc-chart');
        chartDiv.innerHTML = '';
        chart = new ApexCharts(chartDiv, options);
        chart.render();
    }

    function getMinHeight() {
        const form = document.getElementById('qc-traces');
        return Math.max(form.offsetHeight+10, 300);
    }

    async function initialize() {
        const panel = document.getElementById('qc-panel');
        if (panel != null) {
            await fetchData();
            loadParams();
            panel.innerHTML = getContent();
            //panel.style.minHeight = getMinHeight()+'px';
            setConfigFormClasses();
            addEventListeners();
            updateChart();
        }
    }

    // Public API
    return {
        initialize: initialize
    }
})();

document.addEventListener('datasette_init', QuickChartPlugin.initialize);
