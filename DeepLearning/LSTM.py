#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import datetime as dt
import os
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from keras.layers import LSTM
import tensorflow as tf
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import Dense
from keras.layers import LSTM, Activation, BatchNormalization, Bidirectional, Add
from keras.layers import Dropout
from keras.preprocessing import sequence
import matplotlib.dates as mdates
import math
from sklearn.metrics import mean_squared_error,accuracy_score
from keras.wrappers.scikit_learn import KerasClassifier
from sklearn.model_selection import GridSearchCV
from collections import defaultdict

"""
@author : Santhanu
Bidirectional LSTM Network for Time Series Prediction
Created as part of GaTech CSE6242 Group Project
"""

def main(df,plot=False):

    #Parameters
    #timesteps = [2,3,4,5,6]   -> try different window sizes here
    timesteps = [2]
    future_pred = 6
    evaluation_metrics = defaultdict(lambda: defaultdict(dict))
    state = df.columns.values

    print ("Predicting for State {} .........".format(state[0]))

    #split into train and test

    df['{}'.format(state[0])] = df['{}'.format(state[0])].astype(float)
    train_data = df[:70]
    test_data = df[70:]

    #Normalize the data

    sc = MinMaxScaler(feature_range=(0 ,1))
    train_data_scaled = sc.fit_transform(train_data)
    test_data_scaled = sc.fit_transform(test_data)

    for timestep in timesteps:
        #Create Batches

        X_train = []
        Y_train = []

        X_test = []
        Y_test = []
        Y_test_dates = test_data.index.get_values()

        for i in range(timestep,train_data_scaled.shape[0]):

            X_train.append(train_data_scaled[i-timestep:i,0])
            Y_train.append(train_data_scaled[i,0])


        for i in range(timestep,test_data_scaled.shape[0]):

            X_test.append(test_data_scaled[i-timestep:i,0])
            Y_test.append(test_data_scaled[i,0])


        X_train,Y_train = np.array(X_train),np.array(Y_train)

        X_test,Y_test = np.array(X_test),np.array(Y_test)


        #Reshape

        X_train = np.reshape(X_train,(X_train.shape[0],X_train.shape[1],1))

        X_test = np.reshape(X_test,(X_test.shape[0],X_test.shape[1],1))

        #Hyperparameter Tuning

        #Create hyperparameter space
        epochs = [1000,1500,2000,2500]
        batches = [5,10,15]
        optimizers = ['rmsprop','adam']

        neural_network = KerasClassifier(build_fn=create_network, verbose=10)

        # Create hyperparameter options
        hyperparameters = dict(optimizer=optimizers, epochs=epochs, batch_size=batches)

        # Create grid search
        grid = GridSearchCV(estimator=neural_network, param_grid=hyperparameters)

        # Fit grid search
        grid_result = grid.fit(X_train, Y_train)

        # View hyperparameters of best neural network


        best_model_params = grid_result.best_params_


        print ('Best Parameters {}'.format(state),best_model_params)
        evaluation_metrics[timestep]['Best Parameters {}'.format(state)] = score[0]

        # Train Model
        model = Sequential()
        model.add(Bidirectional(LSTM(units=256,activation='relu',return_sequences=True)))
        model.add(Dropout(0.2))
        model.add(LSTM(256,return_sequences=True))
        model.add(Dropout(0.5))
        model.add(Dense(units=1))


        model.compile(loss='mean_squared_error', optimizer=best_model_params['optimizer'], metrics=['accuracy'])
        history = model.fit(X_train, Y_train, epochs=best_model_params['epochs'], batch_size=best_model_params['batch_size'],verbose=0)

        #Evaluate
        train_score = model.evaluate(X_train, Y_train, verbose=0)
        evaluation_metrics[timestep]['Train Loss {}'.format(state)] = train_score[0]
        evaluation_metrics[timestep]['Train Accuracy {}'.format(state)] = train_score[1]
        score = model.evaluate(X_test, Y_test, verbose=0)
        print('Test loss for timestep {}:'.format(timestep), score[0])
        print('Test accuracy for timestep {}:'.format(timestep), score[1])

        evaluation_metrics[timestep]['Test Loss {}'.format(state)] = score[0]
        evaluation_metrics[timestep]['Test Accuracy {}'.format(state)] = score[1]


        #Prediction
        trainPredict = model.predict(X_train)
        testPredict = model.predict(X_test)

        trainPredict = sc.inverse_transform(trainPredict)
        trainY = sc.inverse_transform([Y_train])
        testPredict = sc.inverse_transform(testPredict)
        testY = sc.inverse_transform([Y_test])

        trainY = trainY.reshape(trainY.shape[1], 1)
        testY = testY.reshape(testY.shape[1],1)

        trainScore = math.sqrt(mean_squared_error(trainY, trainPredict))
        print('Timestep {} Train Score: %.2f RMSE'.format(timestep) % (trainScore))
        evaluation_metrics[timestep]['Train RMSE {}'.format(state)] = trainScore

        testScore = math.sqrt(mean_squared_error(testY, testPredict))
        print('Timestep {} Test Score: %.2f RMSE'.format(timestep) % (testScore))
        evaluation_metrics[timestep]['Test RMSE {}'.format(state)] = testScore

        trainScore = (mean_squared_error(trainY, trainPredict))
        print('Timestep {} Train Score: %.2f MSE'.format(timestep) % (trainScore))
        evaluation_metrics[timestep]['Train MSE {}'.format(state)] = trainScore

        testScore = (mean_squared_error(testY, testPredict))
        print('Timestep {} Test Score: %.2f MSE'.format(timestep) % (testScore))
        evaluation_metrics[timestep]['Test MSE {}'.format(state)] = testScore

        trainScore = (accuracy_score(trainY, trainPredict))
        print('Timestep {} Train Score: %.2f Acc'.format(timestep) % (trainScore))
        evaluation_metrics[timestep]['Train Acc {}'.format(state)] = trainScore

        testScore = (accuracy_score(testY, testPredict))
        print('Timestep {} Test Score: %.2f Acc'.format(timestep) % (testScore))
        evaluation_metrics[timestep]['Test Acc {}'.format(state)] = testScore

        if plot :
            test_data_final = test_data[timestep:]
            test_data_final.loc[:,('Predict')] = testPredict
            test_data_final.plot()
            plt.title('{} Housing Test Price Prediction for timestep {}'.format(state,timestep))
            plt.xlabel('Time')
            plt.ylabel('Housing Price')
            plt.legend()
            plt.tight_layout()
            plt.show()
            plt.clf()


    prediction = future_predictions(test_data_scaled,timestep,future_pred,model)
    prediction = prediction.reshape(-1,1)
    pred_final = sc.inverse_transform(prediction)
    merged_df = merge_predictions(pred_final,df,future_pred,state)
    merged_df.index = merged_df.index.strftime('%Y-%m')

    return merged_df,evaluation_metrics

def merge_predictions(predictions,df,future_pred,state):

    pred = {}

    for i in range(1,future_pred+1):

        last_month = df.index[-1]

        month1 = last_month + pd.DateOffset(months=i)

        pred[month1] = predictions[i-1]

    pred_df = pd.DataFrame(pred)
    pred_df = pred_df.T
    pred_df.columns = state
    merge_df = pd.concat([df,pred_df])

    return merge_df

def future_predictions(test_data_scaled,timestep,future_pred,model):
        #Predict 6 months ahead

    prediction = []

    prediction_input1 = test_data_scaled[-timestep:]

    for i in range(future_pred):
        prediction_input = np.reshape(prediction_input1, (prediction_input1.shape[1], prediction_input1.shape[0], 1))
        pred_out = model.predict(prediction_input)

        prediction.append(pred_out[0, 0])

        prediction_input1 = np.concatenate((prediction_input1[1:, :], pred_out), axis=0)

    return np.array(prediction)


def create_network(optimizer='adam'):

    model = Sequential()
    model.add(Bidirectional(LSTM(units=256 ,activation='relu',return_sequences=True)))
    model.add(Dropout(0.2))
    model.add(LSTM(256,return_sequences=True))
    model.add(Dropout(0.5))
    model.add(Dense(units=1))

    model.compile(loss='mean_squared_error', optimizer=optimizer, metrics=['accuracy'])
    return model


if __name__ == "__main__":

    main()
