# CSE6242 Group Project
### Project CSE 6242 - Team 51 (Affordable Housing Analytics) 
### Grant Windes, Santhanu Venugopal Sunitha, Yuanshan (Tracy) Hu, Nicholas Kousen, Manoj Mohanan Nair
### Georgia Institute of Technology	 

# Project Description
### Zillow Data Transformers & Bollinger Bands
Both `transform_foreclosure_data.py` and `transform_median_price_data.py` take original Zillow data in `/data/zillow` (https://www.zillow.com/research/data/) and transform zip code data into county and state data sets for their respective data type. The `bollinger_bands.py` script requires the median price transformer to have been run prior as it utilizes the data created for state and county bollinger band calculations.

### Housing Price Predictions
Using the Scikit-learn and Keras machine learning libraries, we created a bidirectional long short-term memory (LSTM) network to predict median home prices for each of the 50 states over a 6 month period. The models were tuned using KerasClassifier and GridSearchCV.  `getPredictions.py` takes `median_prices.csv` from `/state` folder and generates the predcitions as `state_predictions.csv`.  It also provides the following predcition metrics: Train/Test RMSE, MSE, and Mean Absolute Error and percent error in `Eval_metrics.csv` for reference.


### Visualization
The visualization uses D3.js (v3) as well as D3 plugins topo.js, D3 Queue, and D3 tooltip.  Moment.js is utilized for certain date parsing.

The visualization utilizes the data produced from the python scripts that have cleaned and transformed original median prices and foreclosure data from zillow into state and county data sets. Bollinger bands were then calculated for both state and county from each respective dataset. The visualization code resides within the `/visualization` directory with all local frontend libraries within the `/visualization/libs` directiory.

# Installation

### Python Env Setup (Mac OSX & Linux)
Requires python version `3.6`. Best way to setup the env is using a python virtualenv.

1. `cd` to the root of the repo directory.
2. Create a virtual env with `py 3.6` with: `virtualenv venv -p python3.6`
3. Activate the virtual env `source venv/bin/activate` from within the repo folder
4. Install necessary python libs with `pip install -r requirements.txt`

### Libraries Utilized

#### Python
numpy 1.15.3  <br />
pandas 0.23.4 <br />
dateutil 2.7.5 <br />
pytz 2018.7 <br />
six 1.11.0 <br />
scikit-learn 0.20.0 <br />
tensorflow 1.11.0 <br />
kera 2.2.4 <br />
matplotlib 3.0.0 <br />

#### Javascript
D3 v3 <br />
Moment 2.22.2

# Execution

## Running python scripts
Virtual env must be active for all the below commands!
The following commands calculate & transform data for both county and state visualization data.

#### Run Median Price Transformer
`python transform_median_price_data.py`

#### Run Foreclosure Transformer
`python transform_foreclosure_data.py`

#### Run Bollinger Bands
Note: Bollinger bands must be run after median price
`python bollinger_bands.py`

#### Run LSTM Housing Price Predictions
`python getPredictions.py` 

## Running Visualization

### Locally
You can run the visualization from within the py3.6 virtual env use the following:
`cd` to the root of the project directory. Run `python -m http.server 8080` and go to http://localhost:8080/visualization in Firefox or Chrome for best experience.

You can also run the visualization from outside of the virtual env or use py2.7 and use the command `python -m SimpleHTTPServer 8080`

### Hosted
Or you can visit http://cse6242.winslow.io/ and view the visualization there.
