import csv

def prepend_desc_fields(fields, values):
    vals = fields + list(values)
    return vals


# copied from transform median prices TODO: put into seperate file
def build_topo_state_id_mapper():
    state_topo_ids = dict()

    topojson_mapping_path = 'data/topojson_state_mapping.csv'
    topo_reader = csv.DictReader(open(topojson_mapping_path, 'r'))

    state_abbr_to_full_name = dict()
    state_full_name_to_abbr = dict()

    for row in topo_reader:
        id = row['id']
        state = row['state']
        abbreviation = row['abbreviation']

        state_topo_ids[abbreviation] = id
        state_abbr_to_full_name[abbreviation] = state
        state_full_name_to_abbr[state] = abbreviation

    return state_topo_ids, state_abbr_to_full_name, state_full_name_to_abbr


# copied from transform median prices TODO: put into seperate file
def build_topo_county_id_mapper():
    county_topo_ids = dict()

    topojson_mapping_path = 'data/topojson_county_mapping.csv'
    topo_reader = csv.DictReader(open(topojson_mapping_path, 'r'))

    for row in topo_reader:
        id = row['id']
        state = row['state'] # state is actually abbreviation
        county = row['name'].replace("County", "").replace(" ", "").lower()

        if state not in county_topo_ids:
            county_topo_ids[state] = dict()

        county_topo_ids[state][county] = id

    return county_topo_ids


def get_zip_to_state_county_map():
    zip_to_state_county = dict()
    input_path = 'data/zillow/zip_medianlistingprice_allhomes.csv'
    median_fp = open(input_path, 'r')
    median_reader = csv.DictReader(median_fp)

    for row in median_reader:
        zip = row['RegionName']
        county = row['CountyName']
        abbreviation = row['State']
        zip_to_state_county[zip] = (abbreviation, county)

    return zip_to_state_county


def calc_foreclosures(county_topo_ids, state_topo_ids, state_abbr_to_full_name, state_full_name_to_abbr):
    input_path = 'data/zillow/zip_foreclosures_per_10k_homes.csv'
    foreclosure_fp = open(input_path, 'r')
    foreclosure_reader = csv.DictReader(foreclosure_fp)

    county_out_path = 'data/county/foreclosure_rates.csv'
    county_writer = csv.writer(open(county_out_path, 'w+'))

    state_out_path = 'data/state/foreclosure_rates.csv'
    state_writer = csv.writer(open(state_out_path, 'w+'))

    dates = foreclosure_reader.fieldnames[4:-1]

    # setup headers
    county_headers = ['topo_id', 'state', 'county'] + dates
    county_writer.writerow(county_headers)

    state_headers = ['topo_id', 'state', 'abbreviation'] + dates
    state_writer.writerow(state_headers)

    county_data = dict()
    state_data = dict()
    zip_to_state_county = get_zip_to_state_county_map()

    for row in foreclosure_reader:
        zip = row['RegionName']
        state = row['StateName']

        if zip not in zip_to_state_county:
            continue

        abbreviation, county = zip_to_state_county[zip]
        state_county = (state, county)

        if state_county not in county_data:
            county_data[state_county] = dict()

        if state not in state_data:
            state_data[state] = dict()

        for date in dates:
            if date not in county_data[state_county]:
                county_data[state_county][date] = list()

            if date not in state_data[state]:
                state_data[state][date] = list()

            val = 0.0 if row[date] is '' else float(row[date])

            if val is not 0.0 and val < 100.0:
                county_data[state_county][date].append(val)
                state_data[state][date].append(val)

    state_out = dict()
    county_out = dict()

    # Calculate avg
    for state in state_data.keys():
        state_out[state] = list()
        for date in dates:
            count = len(state_data[state][date])
            if count is not 0:
                avg = (sum(state_data[state][date]) / float(count))
                state_out[state].append(avg)
            else:
                state_out[state].append(0.0)

    for state_county in county_data.keys():
        county_out[state_county] = list()
        for date in dates:
            count = len(county_data[state_county][date])
            if count is not 0:
                county_out[state_county].append(sum(county_data[state_county][date]) / float(count))
            else:
                county_out[state_county].append(0.0)

    # Output results to csv
    for state in sorted(state_data.keys()):
        abbreviation = state_full_name_to_abbr[state]
        topo_id = state_topo_ids[abbreviation]
        row = [topo_id, state, abbreviation] + state_out[state]
        state_writer.writerow(row)

    for state_county in sorted(county_data.keys()):
        state, county = state_county
        abbreviation = state_full_name_to_abbr[state]
        topo_id = county_topo_ids[abbreviation][county.lower().replace(" ", "")]
        row = [topo_id, state, county] + county_out[state_county]
        county_writer.writerow(row)


if __name__ == "__main__":
    county_topo_ids = build_topo_county_id_mapper()
    state_topo_ids, state_abbr_to_full, state_full_to_abbr = build_topo_state_id_mapper()

    calc_foreclosures(county_topo_ids, state_topo_ids, state_abbr_to_full, state_full_to_abbr)
