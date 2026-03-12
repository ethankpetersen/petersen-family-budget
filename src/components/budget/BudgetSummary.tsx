interface Props {
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
}

export function BudgetSummary({ totalBudget, totalActual, totalDifference }: Props) {
  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-positive';
    if (diff < 0) return 'text-negative';
    return 'text-neutral';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <tfoot>
      <tr className="summary-row">
        <td>GRAND TOTAL</td>
        <td>{formatCurrency(totalBudget)}</td>
        <td>{formatCurrency(totalActual)}</td>
        <td className={getDifferenceColor(totalDifference)}>
          {formatCurrency(totalDifference)}
        </td>
      </tr>
    </tfoot>
  );
}
