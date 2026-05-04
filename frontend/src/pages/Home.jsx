import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-indigo-50 via-slate-50 to-transparent" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Official Learning Portal
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Premium learning experience designed for focused preparation
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              A formal, fast, and secure portal for lectures and notes—optimized for mobile and desktop.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Sign In
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Contact
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Video Lectures', value: '500+' },
                { label: 'Students', value: '1000+' },
                { label: 'Batches', value: '50+' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-2xl backdrop-blur">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Structured learning</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Batches, lectures, notes</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Keep everything organized and easy to access on any device.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Secure playback</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Signed video access</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Protected content delivery and device limits for better control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
          <h2 className="text-2xl font-extrabold text-slate-900">Why students choose this portal</h2>
          <p className="mt-2 text-slate-600">
            Designed for a premium, distraction-free learning experience.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'High clarity content', desc: 'A clean interface to focus on what matters.' },
              { title: 'Secure accounts', desc: 'Controlled access with protected playback.' },
              { title: 'Mobile friendly', desc: 'Responsive layouts for phones, tablets, and desktops.' }
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-lg font-bold text-slate-900">{f.title}</p>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-14 pb-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Prathamesh Sir&apos;s LMS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
