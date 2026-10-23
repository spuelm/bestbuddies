import pandas as pd
import numpy as np


df=pd.read_json("C:/Users/steph/OneDrive/Projekte/Bestbuddies/git/bestbuddies/backend/data/04_linkscore/04a_persons_linkscore_pass1.jsonl", lines=True)

print(f"Total number of persons: {len(df)}")
anzahl = (df["linkScore"] == 0).sum()
print(f"Number of persons without  linkScore: {anzahl}")
print(f"Number of persons with     linkScore: {(len(df)-anzahl)}")
print (f"Percentage of persons without  linkScore: {anzahl/len(df)*100:.2f}%")

print(df["linkScore"].between(1,499).sum())

print((df["linkScore"] > 500).sum())