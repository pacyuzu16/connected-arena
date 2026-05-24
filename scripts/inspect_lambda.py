"""Download deployed Lambda code and print specific functions to verify."""
import boto3, zipfile, io, urllib.request

lam = boto3.client("lambda", region_name="eu-central-1")
for fn in ["connected-arena-ConnectFunction-awNwDl8qumo5", "connected-arena-ChatFunction"]:
    print(f"\n══════ {fn} ══════")
    url = lam.get_function(FunctionName=fn)["Code"]["Location"]
    data = urllib.request.urlopen(url).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    src = z.read("handler.py").decode("utf-8")

    # Print the relevant section
    lines = src.splitlines()
    for i, line in enumerate(lines, 1):
        keys = ["CHAT_HISTORY", "chatHistory", "append_to_history",
                "list_append", "_clean", "MAX_HISTORY"]
        if any(k in line for k in keys):
            print(f"  {i:3}: {line}")
