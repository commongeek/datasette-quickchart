from datasette import hookimpl

html = """
<div id="qc-section">
    <button id="qc-open" type="button" onclick="QuickChartPlugin.initialize()">Quick Chart</button>
    <div id="qc-panel"></div>
</div>
"""

@hookimpl
async def extra_js_urls(template, database, table, columns, view_name, request, datasette):
    return [
        'https://cdn.jsdelivr.net/npm/apexcharts',
        '/-/static-plugins/datasette-quickchart/main.js'
    ]

@hookimpl
async def extra_css_urls(template, database, table, columns, view_name, request, datasette):
    return ['/-/static-plugins/datasette-quickchart/main.css']

@hookimpl
def top_table(datasette, request, database, table):
    return html

@hookimpl
def top_query(datasette, request, database, sql):
    return html
