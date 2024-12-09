from datasette import hookimpl

def is_table_or_query(view_name, request):
    return view_name == 'table' or request.path.endswith('/query')

@hookimpl
def extra_body_script(datasette, view_name, request):
    if is_table_or_query(view_name, request):
        config = datasette.plugin_config('datasette-quickchart') or {}
        if 'palette' in config:
            return f"const QUICKCHART_PALETTE = {config['palette']};"
    return []

@hookimpl
async def extra_js_urls(view_name, request):
    if is_table_or_query(view_name, request):
        return [
            'https://cdn.jsdelivr.net/npm/apexcharts',
            '/-/static-plugins/datasette-quickchart/main.js'
        ]
    return []

@hookimpl
async def extra_css_urls(view_name, request):
    if is_table_or_query(view_name, request):
        return ['/-/static-plugins/datasette-quickchart/main.css']
    return []
