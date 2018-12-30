#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import LSTM as lstm
import numpy as np

"""
@author : Santhanu
Get price predictions from median prices dataset
Created as part of GaTech CSE6242 Group Project
"""

def get_data():

    df = pd.read_csv("../data/state/median_prices.csv")
    df = df.T
    states = df.ix[2,:]
    df_head = df.ix[0:3,:].copy()
    df1 = df.ix[3:,:].copy()
    df1.index = df1.index.astype('datetime64[ns]')
    df1.columns = states
    return df1,df_head


def get_predictions():

    df,header = get_data()
    excels = []
    for i in range(df.shape[1]):

        pred,evaluation_metrics = lstm.main(pd.DataFrame(df.ix[:,i]))

        if i == 0:

            df1 = pred
            evaluation_metrics = pd.DataFrame(evaluation_metrics)
            excels.append(evaluation_metrics)

        else:
            df1 = pd.concat([df1,pred],axis=1)
            evaluation_metrics = pd.DataFrame(evaluation_metrics)
            excels.append(evaluation_metrics)

    evaluation_metrics = pd.concat(excels,axis=0)
    evaluation_metrics.to_csv('./Eval_metrics.csv')

    df1 = df1.reset_index()
    header = header.reset_index()
    final = np.concatenate((header.values,df1.values),axis=0)
    final_df = pd.DataFrame(final)
    final_df = final_df.T
    final_df.columns = final_df.ix[0,:]
    final_df = final_df.ix[1:,:]
    final_df.to_csv("state_predictions.csv",index=False)


if __name__ == "__main__":

    get_predictions()