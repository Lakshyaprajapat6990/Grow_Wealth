export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mp-header">
      <div>
        <h1 className="mp-title">{title}</h1>
        {subtitle && <p className="mp-sub">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
