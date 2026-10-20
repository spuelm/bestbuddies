import pandas as pd
import numpy as np


df=pd.read_json("backend/data/all_articles_with_qid_sorted.jsonl", lines=True)

print(f"Total number of persons: {len(df)}")


count = ((df["hasQid"] == True) & (df["articleLength"] < 363)).sum()

print(f"Number of persons with hasQid=True and articleLength<363: {count}")
