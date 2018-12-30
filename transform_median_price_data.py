import csv

def prepend_desc_fields(fields, values):
    vals = fields + list(values)
    return vals


def build_topo_state_id_mapper():
    state_topo_ids = dict()

    topojson_mapping_path = 'data/topojson_state_mapping.csv'
    topo_reader = csv.DictReader(open(topojson_mapping_path, 'r'))

    state_abbr_to_full_name = dict()

    for row in topo_reader:
        id = row['id']
        state = row['state']
        abbreviation = row['abbreviation']

        state_topo_ids[abbreviation] = id
        state_abbr_to_full_name[abbreviation] = state

    return state_topo_ids, state_abbr_to_full_name


def build_topo_county_id_mapper():
    county_topo_ids = dict()

    topojson_mapping_path = 'data/topojson_county_mapping.csv'
    topo_reader = csv.DictReader(open(topojson_mapping_path, 'r'))

    for row in topo_reader:
        id = row['id']
        state = row['state']
        county = row['name'].replace("County", "").replace(" ", "").lower()

        if state not in county_topo_ids:
            county_topo_ids[state] = dict()

        county_topo_ids[state][county] = id

    return county_topo_ids


def calc_median_prices_by_state(topo_ids, full_state_names):
    input_path = 'data/zillow/zip_medianlistingprice_allhomes.csv'
    median_prices_fp = open(input_path, 'r')
    median_price_reader = csv.DictReader(median_prices_fp)

    output_path = 'data/state/median_prices.csv'
    out_writer = csv.writer(open(output_path, 'w+'))

    dates = median_price_reader.fieldnames[6:-1]

    # setup headers
    headers = ['topo_id', 'state', 'abbreviation'] + dates
    out_writer.writerow(headers)

    states = set()
    state_data = dict()

    state_medians = dict()

    for row in median_price_reader:
        state = row['State']

        states.add(state)

        for date in dates:
            val = float(row[date]) if row[date] != '' else 0.0

            if val is 0.0:
                continue

            if state not in state_data:
                state_data[state] = dict()

            if date not in state_data[state]:
                state_data[state][date] = list()

            state_data[state][date].append(val)

    for state in state_data.keys():
        if state not in state_medians:
            state_medians[state] = dict()

        for date in state_data[state].keys():
            count = len(state_data[state][date])
            state_medians[state][date] = sum(state_data[state][date]) / float(count)

    for state in sorted(states):
        topo_id = topo_ids[state]
        state_full_name = full_state_names[state]
        row_data = [topo_id, state_full_name, state]

        for date in dates:
            val = 0.0
            if date in state_medians[state]:
                val = state_medians[state][date]
            row_data.append(val)

        out_writer.writerow(row_data)

    return state_medians

def calc_median_prices_by_county(topo_ids):
    input_path = 'data/zillow/zip_medianlistingprice_allhomes.csv'
    median_prices_fp = open(input_path, 'r')
    median_price_reader = csv.DictReader(median_prices_fp)

    output_path = 'data/county/median_prices.csv'
    out_writer = csv.writer(open(output_path, 'w+'))

    dates = median_price_reader.fieldnames[6:-1]

    # setup headers
    headers = ['topo_id', 'state', 'county'] + dates
    out_writer.writerow(headers)

    states = set()
    counties = set()
    state_counties = set()
    county_data = dict()

    county_display_name = dict()

    county_medians = dict()

    for row in median_price_reader:
        state = row['State']
        county = row['CountyName'].replace(" ", "").lower()

        county_display_name[county] = row['CountyName']

        states.add(state)
        counties.add(county)
        state_counties.add((state, county))

        # values = list()
        for date in dates:
            val = float(row[date]) if row[date] != '' else 0.0
            # values.append(val)

            if val is 0.0:
                continue

            state_county = (state, county)
            if state_county not in county_data:
                county_data[state_county] = dict()

            if date not in county_data[state_county]:
                county_data[state_county][date] = list()

            county_data[state_county][date].append(val)

    for state_county in county_data.keys():
        if state_county not in county_medians:
            county_medians[state_county] = dict()

        for date in county_data[state_county].keys():
            count = len(county_data[state_county][date])
            county_medians[state_county][date] = sum(county_data[state_county][date]) / float(count)

    state_counties = sorted(state_counties)
    for state_county in state_counties:
        state, county = state_county
        topo_id = topo_ids[state][county]

        county_display = county_display_name[county]
        row_data = [topo_id, state, county_display]

        for date in dates:
            val = 0.0
            if date in county_medians[state_county]:
                val = county_medians[state_county][date]
            row_data.append(val)

        out_writer.writerow(row_data)

    return county_medians


if __name__ == "__main__":
    # Calculate County Data
    county_topo_ids = build_topo_county_id_mapper()
    calc_median_prices_by_county(county_topo_ids)

    # Calculate State Data
    state_topo_ids, full_state_names = build_topo_state_id_mapper()
    calc_median_prices_by_state(state_topo_ids, full_state_names)
