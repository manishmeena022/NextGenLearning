interface Props {
    columns: string[];
    data: any[];
}

export default function DataTable({ columns, data }: Props) {
    return (
        <table className="w-full border bg-white">
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col} className="p-3 border">
                            {col}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {data.map((row, i) => (
                    <tr key={i}>
                        {columns.map((col) => (
                            <td key={col} className="p-3 border">
                                {row[col]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
