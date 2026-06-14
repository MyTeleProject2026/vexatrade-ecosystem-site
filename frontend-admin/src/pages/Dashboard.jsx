import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/posts"
          className="bg-[#0f1422] p-6 rounded-xl border border-[#1e2a3a] hover:border-[#00d4ff] transition group"
        >
          <h2 className="text-xl font-semibold text-white group-hover:text-[#00d4ff]">Manage Posts</h2>
          <p className="text-[#b0bedb] mt-2">Create, edit, delete news posts</p>
        </Link>
        <Link
          to="/ebooks"
          className="bg-[#0f1422] p-6 rounded-xl border border-[#1e2a3a] hover:border-[#00d4ff] transition group"
        >
          <h2 className="text-xl font-semibold text-white group-hover:text-[#00d4ff]">Manage Ebooks</h2>
          <p className="text-[#b0bedb] mt-2">Upload, delete ebooks and guides</p>
        </Link>
      </div>
    </div>
  );
}