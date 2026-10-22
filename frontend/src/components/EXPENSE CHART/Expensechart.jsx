import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts";
import styles from './Expensechart.module.css';
import { formatINR } from "../../utils/currency";
const CATEGORY_COLORS = {
    Food: "#C2542F",
    Travel: "#2B6CB8",
    Education: "#B7791F",
};

const FALLBACK_COLORS = ["#7C5CBF", "#1FA2A2", "#D6406A", "#5C7CFA"];

function Expensechart({ expenses }) {

    const categoryData = {};

    expenses.forEach((expense) => {
        const category = expense.category;
        const amount = Number(expense.amount);
        categoryData[category] = (categoryData[category] || 0) + amount;
    });

    const data = Object.keys(categoryData).map((category) => ({
        name: category,
        value: categoryData[category]
    }));

    const colorFor = (name, index) =>
        CATEGORY_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    return (
        <div className={styles.container}>
            <p className={styles.eyebrow}>Breakdown</p>
            <h2 className={styles.title}>Where it goes</h2>

            {data.length === 0 ? (
                <div className={styles.empty}>
                    <p>No expenses yet</p>
                    <span>Add one to see your spending split</span>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={colorFor(entry.name, index)}
                                    stroke="var(--surface)"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatINR(value)}
                            contentStyle={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                fontSize: "0.85rem"
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "0.85rem" }} />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default Expensechart;