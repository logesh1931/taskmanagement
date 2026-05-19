import { useState, useEffect, useCallback, useRef } from "react";

const USERS_DB = {
  "alice@taskflow.io": { password: "alice123", name: "Alice Chen", avatar: "AC", role: "Admin" },
  "bob@taskflow.io": { password: "bob123", name: "Bob Martinez", avatar: "BM", role: "Member" },
  "carol@taskflow.io": { password: "carol123", name: "Carol White", avatar: "CW", role: "Member" },
};

const INITIAL_TASKS = [
  { id: 1, title: "Design new onboarding flow", description: "Create wireframes and prototypes for the new user onboarding experience.", status: "in-progress", priority: "high", assignee: "Alice Chen", avatar: "AC", dueDate: "2026-05-25", tags: ["Design", "UX"], createdBy: "alice@taskflow.io", createdAt: Date.now() - 86400000 * 3, comments: [{ id: 1, author: "Bob Martinez", avatar: "BM", text: "Wireframes look great! Let's sync tomorrow.", time: Date.now() - 3600000 }] },
  { id: 2, title: "Fix authentication bug", description: "Users are being logged out unexpectedly on mobile devices. Investigate and patch.", status: "todo", priority: "urgent", assignee: "Bob Martinez", avatar: "BM", dueDate: "2026-05-21", tags: ["Bug", "Auth"], createdBy: "alice@taskflow.io", createdAt: Date.now() - 86400000 * 1, comments: [] },
  { id: 3, title: "Write API documentation", description: "Document all REST endpoints with request/response examples and error codes.", status: "done", priority: "medium", assignee: "Carol White", avatar: "CW", dueDate: "2026-05-18", tags: ["Docs", "API"], createdBy: "bob@taskflow.io", createdAt: Date.now() - 86400000 * 7, comments: [{ id: 2, author: "Alice Chen", avatar: "AC", text: "Great work on the docs!", time: Date.now() - 7200000 }] },
  { id: 4, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment to staging.", status: "todo", priority: "high", assignee: "Alice Chen", avatar: "AC", dueDate: "2026-05-28", tags: ["DevOps"], createdBy: "carol@taskflow.io", createdAt: Date.now() - 86400000 * 2, comments: [] },
  { id: 5, title: "Performance audit", description: "Analyze bundle size and optimize critical rendering path for sub-2s LCP.", status: "in-progress", priority: "medium", assignee: "Carol White", avatar: "CW", dueDate: "2026-06-01", tags: ["Performance"], createdBy: "alice@taskflow.io", createdAt: Date.now() - 86400000 * 4, comments: [] },
  { id: 6, title: "User interviews — Q2 cohort", description: "Schedule and conduct 10 user interviews to inform Q3 roadmap planning.", status: "todo", priority: "low", assignee: "Bob Martinez", avatar: "BM", dueDate: "2026-06-05", tags: ["Research"], createdBy: "bob@taskflow.io", createdAt: Date.now() - 3600000, comments: [] },
];

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "#E24B4A", bg: "#FCEBEB", dot: "#E24B4A" },
  high:   { label: "High",   color: "#BA7517", bg: "#FAEEDA", dot: "#EF9F27" },
  medium: { label: "Medium", color: "#185FA5", bg: "#E6F1FB", dot: "#378ADD" },
  low:    { label: "Low",    color: "#3B6D11", bg: "#EAF3DE", dot: "#639922" },
};

const STATUS_CONFIG = {
  todo:        { label: "To Do",       icon: "○", color: "#888780", bg: "#F1EFE8" },
  "in-progress": { label: "In Progress", icon: "◐", color: "#185FA5", bg: "#E6F1FB" },
  done:        { label: "Done",        icon: "●", color: "#0F6E56", bg: "#E1F5EE" },
};

const TAGS_COLORS = {
  Design: "#534AB7", UX: "#993556", Bug: "#993C1D", Auth: "#185FA5",
  Docs: "#3B6D11", API: "#0F6E56", DevOps: "#854F0B", Performance: "#993556",
  Research: "#534AB7",
};

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
function isOverdue(dateStr) {
  return new Date(dateStr) < new Date() && dateStr;
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
            <div key={t.id} style={{ background: t.type === "error" ? "#FCEBEB" : t.type === "success" ? "#E1F5EE" : "#E6F1FB", border: `1px solid ${t.type === "error" ? "#F09595" : t.type === "success" ? "#5DCAA5" : "#85B7EB"}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, color: t.type === "error" ? "#A32D2D" : t.type === "success" ? "#0F6E56" : "#185FA5", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 220, animation: "slideIn 0.2s ease" }}>
              <span>{t.type === "error" ? "✕" : t.type === "success" ? "✓" : "ℹ"}</span>
              {t.message}
            </div>
        ))}
      </div>
  );
}

// ── AVATAR ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32, color = "#534AB7", bg = "#EEEDFE" }) {
  return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, color, flexShrink: 0, fontFamily: "system-ui" }}>
        {initials}
      </div>
  );
}

// ── LOGIN PAGE ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("alice@taskflow.io");
  const [password, setPassword] = useState("alice123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 600));
    const user = USERS_DB[email];
    if (user && user.password === password) {
      onLogin({ email, ...user });
    } else {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0C447C 0%, #185FA5 50%, #378ADD 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}} * { box-sizing: border-box; } input { outline: none; } input:focus { border-color: #378ADD !important; box-shadow: 0 0 0 3px rgba(55,138,221,0.15) !important; }`}</style>
        <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #185FA5, #378ADD)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✦</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#2C2C2A", letterSpacing: "-0.5px" }}>TaskFlow</h1>
            <p style={{ margin: "6px 0 0", color: "#888780", fontSize: 14 }}>Sign in to your workspace</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#444441", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", transition: "all 0.2s" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#444441", marginBottom: 6 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", transition: "all 0.2s" }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          {error && <div style={{ background: "#FCEBEB", border: "1px solid #F09595", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "#B5D4F4" : "linear-gradient(135deg, #185FA5, #378ADD)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div style={{ marginTop: 24, padding: "16px", background: "#F1EFE8", borderRadius: 10 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px" }}>Demo Accounts</p>
            {Object.entries(USERS_DB).map(([e, u]) => (
                <div key={e} onClick={() => { setEmail(e); setPassword(u.password); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                  <Avatar initials={u.avatar} size={22} />
                  <span style={{ fontSize: 12, color: "#444441" }}>{u.name} — <span style={{ color: "#888780" }}>{e}</span></span>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

// ── TASK MODAL ─────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDelete, currentUser, allUsers }) {
  const isNew = !task.id;
  const [form, setForm] = useState({ title: task.title || "", description: task.description || "", status: task.status || "todo", priority: task.priority || "medium", assignee: task.assignee || currentUser.name, avatar: task.avatar || currentUser.avatar, dueDate: task.dueDate || "", tags: task.tags || [], comments: task.comments || [] });
  const [newComment, setNewComment] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...task, ...form, id: task.id || Date.now(), createdBy: task.createdBy || currentUser.email, createdAt: task.createdAt || Date.now() });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const c = { id: Date.now(), author: currentUser.name, avatar: currentUser.avatar, text: newComment, time: Date.now() };
    set("comments", [...form.comments, c]);
    setNewComment("");
  };

  const removeTag = (t) => set("tags", form.tags.filter(x => x !== t));
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const assigneeUser = Object.values(USERS_DB).find(u => u.name === form.assignee);

  return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(2px)" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", animation: "fadeUp 0.25s ease" }}>
          <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2C2C2A" }}>{isNew ? "New Task" : "Edit Task"}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {!isNew && <button onClick={() => onDelete(task.id)} style={{ padding: "6px 14px", background: "#FCEBEB", border: "1px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", cursor: "pointer", fontWeight: 500 }}>Delete</button>}
              <button onClick={onClose} style={{ padding: "6px 10px", background: "#F1EFE8", border: "none", borderRadius: 8, fontSize: 18, color: "#5F5E5A", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div style={{ padding: "20px 28px" }}>
            {/* Title */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="What needs to be done?" style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${errors.title ? "#E24B4A" : "#D3D1C7"}`, borderRadius: 10, fontSize: 15, color: "#2C2C2A", outline: "none" }} />
              {errors.title && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#E24B4A" }}>{errors.title}</p>}
            </div>
            {/* Description */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Add more details…" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", outline: "none", resize: "vertical", fontFamily: "system-ui" }} />
            </div>
            {/* Status + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", outline: "none", background: "white" }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Priority</label>
                <select value={form.priority} onChange={e => set("priority", e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", outline: "none", background: "white" }}>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            {/* Assignee + Due Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Assignee</label>
                <select value={form.assignee} onChange={e => { const u = Object.values(USERS_DB).find(x => x.name === e.target.value); set("assignee", e.target.value); if (u) set("avatar", u.avatar); }} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", outline: "none", background: "white" }}>
                  {Object.values(USERS_DB).map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${errors.dueDate ? "#E24B4A" : "#D3D1C7"}`, borderRadius: 10, fontSize: 14, color: "#2C2C2A", outline: "none" }} />
                {errors.dueDate && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#E24B4A" }}>{errors.dueDate}</p>}
              </div>
            </div>
            {/* Tags */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {form.tags.map(t => (
                    <span key={t} style={{ padding: "3px 10px", background: "#EEEDFE", borderRadius: 20, fontSize: 12, fontWeight: 500, color: "#534AB7", display: "flex", alignItems: "center", gap: 4 }}>
                  {t} <span onClick={() => removeTag(t)} style={{ cursor: "pointer", opacity: 0.6 }}>×</span>
                </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Add tag…" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 8, fontSize: 13, outline: "none" }} />
                <button onClick={addTag} style={{ padding: "8px 14px", background: "#EEEDFE", border: "1px solid #CEC BF6", borderRadius: 8, fontSize: 13, color: "#534AB7", cursor: "pointer", fontWeight: 500 }}>Add</button>
              </div>
            </div>
            {/* Comments */}
            {!isNew && (
                <div style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 10 }}>Comments ({form.comments.length})</label>
                  {form.comments.map(c => (
                      <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <Avatar initials={c.avatar} size={28} />
                        <div style={{ flex: 1, background: "#F1EFE8", borderRadius: 10, padding: "8px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#2C2C2A" }}>{c.author}</span>
                            <span style={{ fontSize: 11, color: "#888780" }}>{timeAgo(c.time)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#444441", lineHeight: 1.5 }}>{c.text}</p>
                        </div>
                      </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Avatar initials={currentUser.avatar} size={28} />
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()} placeholder="Add a comment…" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none" }} />
                      <button onClick={addComment} style={{ padding: "8px 14px", background: "#185FA5", border: "none", borderRadius: 10, fontSize: 13, color: "white", cursor: "pointer", fontWeight: 500 }}>Post</button>
                    </div>
                  </div>
                </div>
            )}
          </div>
          <div style={{ padding: "0 28px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", background: "#F1EFE8", border: "none", borderRadius: 10, fontSize: 14, color: "#5F5E5A", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #185FA5, #378ADD)", border: "none", borderRadius: 10, fontSize: 14, color: "white", cursor: "pointer", fontWeight: 600 }}>{isNew ? "Create Task" : "Save Changes"}</button>
          </div>
        </div>
      </div>
  );
}

// ── TASK CARD ──────────────────────────────────────────────────────────────
function TaskCard({ task, onClick, onStatusChange }) {
  const p = PRIORITY_CONFIG[task.priority];
  const s = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate) && task.status !== "done";

  return (
      <div onClick={() => onClick(task)} style={{ background: "white", border: "1.5px solid #E8E6DF", borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
           onMouseEnter={e => { e.currentTarget.style.borderColor = "#B5D4F4"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(24,95,165,0.10)"; }}
           onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E6DF"; e.currentTarget.style.boxShadow = "none"; }}>
        {/* Priority stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: p.color, borderRadius: "14px 0 0 14px" }} />
        <div style={{ marginLeft: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A", lineHeight: 1.4, flex: 1 }}>{task.title}</h3>
            <span onClick={e => { e.stopPropagation(); onStatusChange(task); }} style={{ marginLeft: 8, padding: "3px 8px", background: s.bg, borderRadius: 20, fontSize: 11, fontWeight: 500, color: s.color, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }} title="Click to cycle status">{s.icon} {s.label}</span>
          </div>
          {task.description && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888780", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{task.description}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {task.tags.map(t => <span key={t} style={{ padding: "2px 8px", background: "#F1EFE8", borderRadius: 20, fontSize: 11, fontWeight: 500, color: TAGS_COLORS[t] || "#534AB7" }}>{t}</span>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Avatar initials={task.avatar} size={22} />
              <span style={{ fontSize: 12, color: "#5F5E5A" }}>{task.assignee}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {task.comments.length > 0 && <span style={{ fontSize: 11, color: "#888780" }}>💬 {task.comments.length}</span>}
              <span style={{ fontSize: 11, color: overdue ? "#E24B4A" : "#888780", fontWeight: overdue ? 600 : 400 }}>
              {overdue ? "⚠ " : ""}{formatDate(task.dueDate)}
            </span>
            </div>
          </div>
        </div>
      </div>
  );
}

// ── KANBAN COLUMN ──────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, onTaskClick, onStatusChange }) {
  const s = STATUS_CONFIG[status];
  return (
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2C2C2A", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "white", background: s.color, borderRadius: 20, padding: "1px 8px", minWidth: 22, textAlign: "center" }}>{tasks.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map(t => <TaskCard key={t.id} task={t} onClick={onTaskClick} onStatusChange={onStatusChange} />)}
          {tasks.length === 0 && <div style={{ border: "2px dashed #E8E6DF", borderRadius: 12, padding: "24px 16px", textAlign: "center", color: "#B4B2A9", fontSize: 13 }}>No tasks here</div>}
        </div>
      </div>
  );
}

// ── STATS BAR ──────────────────────────────────────────────────────────────
function StatsBar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const urgent = tasks.filter(t => t.priority === "urgent" && t.status !== "done").length;
  const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.status !== "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const cards = [
    { label: "Total", value: total, color: "#185FA5", bg: "#E6F1FB" },
    { label: "Done", value: done, color: "#0F6E56", bg: "#E1F5EE" },
    { label: "In Progress", value: inProgress, color: "#185FA5", bg: "#E6F1FB" },
    { label: "Urgent", value: urgent, color: "#A32D2D", bg: "#FCEBEB" },
    { label: "Overdue", value: overdue, color: "#993C1D", bg: "#FAECE7" },
  ];

  return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 14 }}>
          {cards.map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 12, color: c.color, opacity: 0.8, fontWeight: 500 }}>{c.label}</div>
              </div>
          ))}
        </div>
        <div style={{ background: "#F1EFE8", borderRadius: 100, height: 6, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(90deg, #1D9E75, #0F6E56)", height: "100%", width: `${pct}%`, borderRadius: 100, transition: "width 0.6s ease" }} />
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888780", textAlign: "right" }}>{pct}% complete</p>
      </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [view, setView] = useState("board");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [toasts, setToasts] = useState([]);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const toastId = useRef(0);
  const liveTimer = useRef(null);

  const addToast = useCallback((message, type = "success") => {
    const id = ++toastId.current;
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3500);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const otherUsers = Object.values(USERS_DB).filter(u => u.name !== currentUser.name);
      const u = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      const actions = ["added a comment to", "updated the status of", "is now working on"];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setTasks(prev => {
        const nonDone = prev.filter(t => t.status !== "done");
        if (!nonDone.length) return prev;
        const t = nonDone[Math.floor(Math.random() * nonDone.length)];
        addToast(`${u.name} ${action} "${t.title}"`, "info");
        return prev;
      });
      setLiveIndicator(true);
      clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => setLiveIndicator(false), 2000);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser, addToast]);

  const filteredTasks = tasks
      .filter(t => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterPriority !== "all" && t.priority !== filterPriority) return false;
        if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "dueDate") return new Date(a.dueDate) - new Date(b.dueDate);
        if (sortBy === "priority") { const order = { urgent: 0, high: 1, medium: 2, low: 3 }; return order[a.priority] - order[b.priority]; }
        return b.createdAt - a.createdAt;
      });

  const handleSaveTask = (task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) {
        addToast("Task updated successfully");
        return prev.map(t => t.id === task.id ? task : t);
      } else {
        addToast("Task created!");
        return [task, ...prev];
      }
    });
    setModal(null);
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast("Task deleted", "error");
    setModal(null);
  };

  const cycleStatus = (task) => {
    const cycle = { todo: "in-progress", "in-progress": "done", done: "todo" };
    const updated = { ...task, status: cycle[task.status] };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    addToast(`Moved to "${STATUS_CONFIG[updated.status].label}"`);
  };

  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    "in-progress": filteredTasks.filter(t => t.status === "in-progress"),
    done: filteredTasks.filter(t => t.status === "done"),
  };

  return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <style>{`@keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} * { box-sizing: border-box; }`}</style>

        {/* Sidebar */}
        <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 220, background: "#0C447C", display: "flex", flexDirection: "column", zIndex: 100 }}>
          <div style={{ padding: "20px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
              <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>TaskFlow</span>
              {liveIndicator && <span style={{ width: 6, height: 6, background: "#5DCAA5", borderRadius: "50%", marginLeft: "auto", animation: "pulse 1s infinite" }} title="Live updates" />}
            </div>
            {[
              { key: "board", label: "Board", icon: "▦" },
              { key: "list", label: "List", icon: "≡" },
            ].map(nav => (
                <button key={nav.key} onClick={() => setView(nav.key)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: view === nav.key ? "rgba(255,255,255,0.15)" : "transparent", border: "none", borderRadius: 8, color: view === nav.key ? "white" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: view === nav.key ? 600 : 400, cursor: "pointer", marginBottom: 4, textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{nav.icon}</span> {nav.label}
                </button>
            ))}
          </div>
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar initials={currentUser.avatar} size={32} color="#185FA5" bg="rgba(255,255,255,0.2)" />
              <div>
                <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{currentUser.role}</div>
              </div>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ width: "100%", padding: "7px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}>Sign Out</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginLeft: 220, padding: "28px 28px", animation: "fadeUp 0.3s ease" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#2C2C2A", letterSpacing: "-0.5px" }}>My Workspace</h1>
              <p style={{ margin: "2px 0 0", fontSize: 14, color: "#888780" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
            <button onClick={() => setModal({ status: "todo", priority: "medium", tags: [], comments: [] })} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #185FA5, #378ADD)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              + New Task
            </button>
          </div>

          <StatsBar tasks={tasks} />

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search tasks…" style={{ flex: "1 1 180px", padding: "8px 14px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none", background: "white" }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none", background: "white", color: "#2C2C2A" }}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none", background: "white", color: "#2C2C2A" }}>
              <option value="all">All Priority</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none", background: "white", color: "#2C2C2A" }}>
              <option value="all">All Assignees</option>
              {Object.values(USERS_DB).map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #D3D1C7", borderRadius: 10, fontSize: 13, outline: "none", background: "white", color: "#2C2C2A" }}>
              <option value="createdAt">Newest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          {/* Board View */}
          {view === "board" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {Object.keys(STATUS_CONFIG).map(s => <KanbanColumn key={s} status={s} tasks={tasksByStatus[s]} onTaskClick={setModal} onStatusChange={cycleStatus} />)}
              </div>
          )}

          {/* List View */}
          {view === "list" && (
              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #E8E6DF", overflow: "hidden" }}>
                {filteredTasks.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "#B4B2A9" }}>No tasks match your filters</div>
                ) : filteredTasks.map((task, i) => {
                  const p = PRIORITY_CONFIG[task.priority];
                  const s = STATUS_CONFIG[task.status];
                  const overdue = isOverdue(task.dueDate) && task.status !== "done";
                  return (
                      <div key={task.id} onClick={() => setModal(task)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < filteredTasks.length - 1 ? "1px solid #F1EFE8" : "none", cursor: "pointer", transition: "background 0.1s" }}
                           onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"}
                           onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ width: 4, height: 36, background: p.color, borderRadius: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                            {task.tags.slice(0, 3).map(t => <span key={t} style={{ padding: "1px 6px", background: "#F1EFE8", borderRadius: 20, fontSize: 10, fontWeight: 500, color: TAGS_COLORS[t] || "#534AB7" }}>{t}</span>)}
                          </div>
                        </div>
                        <span style={{ padding: "3px 10px", background: s.bg, borderRadius: 20, fontSize: 11, fontWeight: 500, color: s.color, flexShrink: 0 }}>{s.label}</span>
                        <span style={{ padding: "3px 10px", background: p.bg, borderRadius: 20, fontSize: 11, fontWeight: 500, color: p.color, flexShrink: 0 }}>{p.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <Avatar initials={task.avatar} size={24} />
                          <span style={{ fontSize: 12, color: "#5F5E5A", display: "none" }}>{task.assignee}</span>
                        </div>
                        <span style={{ fontSize: 12, color: overdue ? "#E24B4A" : "#888780", fontWeight: overdue ? 600 : 400, flexShrink: 0, minWidth: 70, textAlign: "right" }}>{overdue ? "⚠ " : ""}{formatDate(task.dueDate)}</span>
                        {task.comments.length > 0 && <span style={{ fontSize: 11, color: "#B4B2A9", flexShrink: 0 }}>💬 {task.comments.length}</span>}
                      </div>
                  );
                })}
              </div>
          )}
        </div>

        {modal && (
            <TaskModal
                task={modal}
                onClose={() => setModal(null)}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                currentUser={currentUser}
                allUsers={Object.values(USERS_DB)}
            />
        )}

        <Toast toasts={toasts} />
      </div>
  );
}
