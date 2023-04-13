import psycopg2
from urllib.parse import urlparse

db_uri = "postgres://psqladmin:psqladmin4me@138.68.231.110:5432/defaultdb"

def get_psql_connection():
    uri = urlparse(db_uri)
    conn = psycopg2.connect(
        database=uri.path[1:],
        user=uri.username,
        password=uri.password,
        host=uri.hostname,
        port=uri.port
    )
    cur = conn.cursor()
    return cur, conn

def get_column_names_from_table(table_name, cur):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
    column_names = [row[0] for row in cur.fetchall()]
    column_names.remove("id")
    return column_names

def find_changing_columns():
    table_name = "clickflare"
    cur, conn = get_psql_connection()
    columns = get_column_names_from_table(table_name, cur)

    for i, column in enumerate(columns):
        if column != 'click_id': continue
        select_cols = [c for c in columns if c != column]
        group_by_cols_str = ", ".join(select_cols)
        query = f"SELECT COUNT(*), ARRAY_AGG({column}) FROM {table_name} GROUP BY {group_by_cols_str}"
        cur.execute(query)
        list_of_aggregated_arrays = [row[1] for row in cur.fetchall()]

        changes = False
        for aggregated_array in list_of_aggregated_arrays:
            if len(set(aggregated_array)) != 1:
                changes = True

        if changes: print(f"{column} column changes.")
        else: print(f"{column} doesn't change")

    cur.close()
    conn.close()

if __name__ == "__main__":
    find_changing_columns()