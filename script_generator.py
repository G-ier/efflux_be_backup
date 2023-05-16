from datetime import datetime, timedelta

def last_60_days():
    today = datetime.today()
    for i in range(61):
        day = today - timedelta(days=i)
        partition_name = day.strftime("%Y_%m_%d")
        date_start = day.strftime("%Y-%m-%d")
        date_stop = (day + timedelta(days=1)).strftime("%Y-%m-%d")
        print(f"CREATE TABLE crossroads_partitioned_{partition_name} PARTITION OF crossroads_partitioned FOR VALUES FROM ('{date_start}') TO ('{date_stop}');")
        # print(f"DROP TABLE crossroads_stats_partitioned_{partition_name};")

last_60_days()
