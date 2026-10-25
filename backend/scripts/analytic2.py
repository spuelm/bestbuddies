import pandas as pd
import numpy as np

datadir="C:/Users/steph/OneDrive/Projekte/Bestbuddies/git/bestbuddies/backend/data";
dfin=pd.read_json(datadir+"/02_person_candidates_sorted/02_person_candidates_sorted.jsonl", lines=True)


dfout=pd.read_json(datadir+"/04_linkscore/_04a_persons_linkscore_pass1.jsonl", lines=True)

df_not_in_out = (
    dfin.merge(dfout[['pageid']], on='pageid', how='left', indicator=True)
        .query("_merge == 'left_only'")
        .drop(columns="_merge")
)
print(len(df_not_in_out))
print(df_not_in_out)


df_not_in_out = (
    dfout.merge(dfin[['pageid']], on='pageid', how='left', indicator=True)
        .query("_merge == 'left_only'")
        .drop(columns="_merge")
)
print(len(df_not_in_out))
print(df_not_in_out)
