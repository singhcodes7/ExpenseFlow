
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts";

import styles from "./Expensechart.module.css";
import { formatINR } from "../../utils/currency";

const CATEGORY_COLORS = {
    Food: "#20C58A",
    Travel: "#5798F5",
    Education: "#A78BFA",
};

const FALLBACK_COLORS = [
    "#F59E0B",
    "#EC6B91",
    "#38BDF8",
    "#A3E635",
    "#F97316",
];

function Expensechart({ expenses = [] }) {
    const categoryData = {};

    expenses.forEach((expense) => {
        const category = expense.category;
        const amount = Number(expense.amount);

        categoryData[category] =
            (categoryData[category] || 0) + amount;
    });

    const data = Object.keys(categoryData).map((category) => ({
        name: category,
        value: categoryData[category],
    }));

    const total = data.reduce(
        (sum, item) => sum + item.value,
        0
    );

    const colorFor = (name, index) =>
        CATEGORY_COLORS[name] ||
        FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    return (
        <div className={styles.container}>
            {data.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>◔</div>

                    <h3>No expenses yet</h3>

                    <p>
                        Add your first expense to see your
                        spending breakdown here.
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer
                            width="100%"
                            height={280}
                        >
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    cornerRadius={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={colorFor(entry.name, index)}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) => [
                                        formatINR(value),
                                        "Amount",
                                    ]}
                                    contentStyle={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "12px",
                                        padding: "10px 13px",
                                        color: "var(--text)",
                                        boxShadow:
                                            "0 8px 24px rgba(0,0,0,.12)",
                                    }}
                                />

                                <Legend
                                    iconType="circle"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{
                                        fontSize: "12px",
                                        paddingTop: "12px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className={styles.chartCenter}>
                            <span>Total spent</span>
                            <strong>{formatINR(total)}</strong>
                        </div>
                    </div>

                    <div className={styles.categoryBreakdown}>
                        {data.map((item, index) => {
                            const percentage =
                                total > 0
                                    ? (item.value / total) * 100
                                    : 0;

                            return (
                                <div
                                    className={styles.categoryItem}
                                    key={item.name}
                                >
                                    <div className={styles.categoryInfo}>
                                        <span
                                            className={styles.categoryDot}
                                            style={{
                                                background: colorFor(
                                                    item.name,
                                                    index
                                                ),
                                            }}
                                        />

                                        <span className={styles.categoryName}>
                                            {item.name}
                                        </span>

                                        <strong>
                                            {percentage.toFixed(1)}%
                                        </strong>
                                    </div>

                                    <div className={styles.progressTrack}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${percentage}%`,
                                                background: colorFor(
                                                    item.name,
                                                    index
                                                ),
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default Expensechart;
