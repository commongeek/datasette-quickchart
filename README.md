[![Changelog](https://img.shields.io/github/v/release/commongeek/datasette-quickchart?include_prereleases&label=changelog)](https://github.com/commongeek/datasette-quickchart/releases)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/commongeek/datasette-quickchart/blob/main/LICENSE)

# datasette-quickchart
Datasette plugin for making quick charts from tables and SQL queries using Apex Charts. It only takes 2 clicks to make a first chart.

# demo
http://113-30-189-7.cloud-xip.com:8001/demo_data/data_chart

## Requirements

Requires Datesette version >= 1.0a16. It won't work with 0.65 and earlier. It may work with earlier versions of 1.0 but it has not been checked.

## Installation

The plugin is single-file and 100% JS, so no installation via PyPI packages is required. Just add a link to your Datasette configuration:

- if you use YAML format:
```yaml
extra_js_urls:
- https://cdn.jsdelivr.net/gh/commongeek/datasette-quickchart@latest/quickchart.min.js
```

- if you use JSON format:
```json
  "extra_js_urls": [
    "https://cdn.jsdelivr.net/gh/commongeek/datasette-quickchart@latest/quickchart.min.js"
  ]
```
The plugin will then add itself to every Datasette table and query view.
If you want to host locally you need to copy the quickchart.js file to your static directory and modify the URL accordingly.

## Configuration

Currently, the only configurable option is to choose the color palette used by the charts (compatible with https://apexcharts.com/docs/options/theme/). The default is palette7 because it seems to me to be the most consistent with the Datasette color scheme.

You can set the palette number by adding an argument to the script URL, e.g.
```bash
https://cdn.jsdelivr.net/gh/commongeek/datasette-quickchart@latest/quickchart.min.js?palette=1
```

## Features

| Feature | Status | Description |
| --- | --- | --- |
| Many types of charts | + | Line, scatter, area, bar, stacked bar and pie.  |
| Works in both table and query views | + ||
| Fast | + | Data is loaded only once. |
| Keeps settings | + | With the current settings saved in sessionStorage, the chart persists across actions like sorting, moving to the next page of results, and so on. |
| Interactive | + | The chart supports zooming, scrolling, and other interactions. |
| Resizable | + | The chart can be resized by dragging its bottom-right corner. |
| Export | + | The chart supports exporting to PNG or SVG formats. |
| Aggregation | + | Data can be aggregated as a sum or an average. More advanced aggregations are possible through appropriate SQL queries or views. |
| Considers all data | + | The chart shows all data up to max_returned_rows Datasette setting, not just the data visible on the current results page. |
| Recognition of data types | + | The plugin analyzes the data in each column and classifies it into one of the following types: numeric, categorical, date/time, or null (if all values in the column are null). Timestamps are currently interpreted as numeric values, and I am unsure how to modify this behavior at the moment. |

## Screenshots

![Bar demo](screenshots/bar_demo.png)
![Line demo](screenshots/line_demo.png)
![Scatter demo](screenshots/scatter_demo.png)
![Pie demo](screenshots/pie_demo.png)
