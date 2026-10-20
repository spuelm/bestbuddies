import pandas as pd
import numpy as np


df=pd.read_json("backend/data/person_candidates_sorted.jsonl", lines=True)

print(f"Total number of persons: {len(df)}")
print(df["ns"].value_counts())

