import csv
import pandas as pd
import numpy as np

WINDOW = 20


def sma(prices):
    # SMA/Price indicator
    prices = pd.Series(prices)
    avgs = prices.rolling(WINDOW).mean()
    # sma = pd.rolling_mean(prices, window=12) / prices
    # sma = (sma - np.mean(sma)) / np.std(sma)
    return avgs


def bollinger_bands(prices):
    # Bollinger Bands
    prices = pd.Series(prices)

    rolling_std = prices.rolling(WINDOW).std()[WINDOW:]
    rolling_avg = prices.rolling(WINDOW).mean()[WINDOW:]
    upper_band = rolling_avg + (2.0 * rolling_std)
    lower_band = rolling_avg - (2.0 * rolling_std)
    mid_band = rolling_avg

    return upper_band, mid_band, lower_band


def prepend_desc_fields(fields, values):
    vals = fields + list(values)
    return vals


def calculate_bands(type):
    median_csv_path = 'data/{}/median_prices.csv'.format(type)
    median_prices_fp = open(median_csv_path, 'r')

    reader = csv.DictReader(median_prices_fp)

    # bollinger bands output csvs
    upper_path = 'data/{}/bollinger_bands_upper_output.csv'.format(type)
    mid_path = 'data/{}/bollinger_bands_mid_output.csv'.format(type)
    lower_path = 'data/{}/bollinger_bands_lower_output.csv'.format(type)

    upper_writer = csv.writer(open(upper_path, 'w+'))
    mid_writer = csv.writer(open(mid_path, 'w+'))
    lower_writer = csv.writer(open(lower_path, 'w+'))

    start_date = reader.fieldnames[6]
    end_date = reader.fieldnames[-1]

    desc_fields = reader.fieldnames[:5]
    dates = reader.fieldnames[6:-1]

    #setup headers
    headers = desc_fields + dates[WINDOW:]
    upper_writer.writerow(headers)
    mid_writer.writerow(headers)
    lower_writer.writerow(headers)

    for row in reader:
        values = list()
        for date in dates:
            val = row[date] if row[date] != '' else 0.0
            values.append(val)

        upper, mid, lower = bollinger_bands(values)

        location_fields = list()
        for desc in desc_fields:
            location_fields.append(row[desc])

        upper = prepend_desc_fields(location_fields, upper)
        mid = prepend_desc_fields(location_fields, mid)
        lower = prepend_desc_fields(location_fields, lower)

        upper_writer.writerow(upper)
        mid_writer.writerow(mid)
        lower_writer.writerow(lower)

if __name__ == "__main__":
    calculate_bands('county')
    calculate_bands('state')
