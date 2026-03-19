export const dynamic = "force-dynamic";

import { getCustomers } from "../actions/customers";
import CreateCustomerForm from "./CreateCustomerForm";
import DeleteCustomerButton from "./DeleteCustomerButton";
import EditCustomerButton from "./EditCustomerButton";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1 }}>Customers</div>
          <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "13px" }}>
            {customers.length} client{customers.length !== 1 ? "s" : ""}
          </div>
        </div>
        <CreateCustomerForm />
      </div>

      {customers.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No customers yet. Add your first client above.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Projects</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td style={{ color: "var(--text)", fontWeight: 500 }}>{c.name}</td>
                <td>{c.email ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td>{c.address ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td><span style={{ color: "var(--amber)" }}>{c.projects.length}</span></td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <EditCustomerButton customer={c} />
                    <DeleteCustomerButton customerId={c.id} customerName={c.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
