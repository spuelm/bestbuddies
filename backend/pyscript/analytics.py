import pandas as pd
import numpy as np
from pylib.utils import measure_runtime

from pylib.config import (
    PERSONS_LINKSCORE_PASS1_FILE,
    PERSONS_LINKSCORE_PASS2_FILE,
)


@measure_runtime
def run():
    print(PERSONS_LINKSCORE_PASS1_FILE)
    print("please wait....")
    df = pd.read_json(PERSONS_LINKSCORE_PASS1_FILE, lines=True)
    ls0 = (df["linkScore"] == 0).sum()
    plen = len(df)
    print(f"Total number of persons: {plen}")
    print(f"linkScore == 0: {ls0}")
    print(f"linkScore !=0: {(plen-ls0)}")
    print(f"linkScore >= 500 {(df["linkScore"]>=500).sum()}")
    print(f"hasMoreLinks == True {(df["hasMoreLinks"]==True).sum()}")
    print(f"hasMoreLinks == False {(df["hasMoreLinks"]==False).sum()}")

    print("----------------------------------------------------------------------")

    df = pd.read_json(PERSONS_LINKSCORE_PASS2_FILE, lines=True)
    ls0 = (df["linkScore"] == 0).sum()
    plen = len(df)
    print(f"Total number of persons: {plen}")
    print(f"linkScore == 0: {ls0}")
    print(f"linkScore !=0: {(plen-ls0)}")
    print(f"linkScore >= 500 {(df["linkScore"]>=500).sum()}")
    print(f"hasMoreLinks == True {(df["hasMoreLinks"]==True).sum()}")
    print(f"hasMoreLinks == False {(df["hasMoreLinks"]==False).sum()}")

    print("----------------------------------------------------------------------")


if __name__ == "__main__":
    run()
