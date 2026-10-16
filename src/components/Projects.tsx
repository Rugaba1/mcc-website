"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, type Project } from "@/lib/api";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.getProjects().then(setProjects).catch(console.error);
  }, []);

  if (!mounted) return null;

  return (
    <section id="projects" className="py-24 ">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
              <span className="gold-divider" />
              Our Work
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold  leading-tight">
              Featured Projects
            </h2>
          </div>
          <p className=" text-base max-w-sm leading-relaxed md:text-right">
            Tiles shaping Rwanda&apos;s most iconic spaces — from hospitality to infrastructure.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className=" text-center py-20">No projects yet. Add some in the admin portal.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {projects[0] && (
              <div className="md:col-span-7 relative overflow-hidden group min-h-[420px] cursor-pointer">
                <Image
                  src={projects[0].image}
                  alt={projects[0].title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 58vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="inline-block bg-primary  text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 mb-3">
                    {projects[0].type}
                  </span>
                  <h3 className="font-playfair  font-bold text-2xl mb-2">{projects[0].title}</h3>
                  <p className="text-ivory/70 text-sm leading-relaxed max-w-md">{projects[0].description}</p>
                </div>
              </div>
            )}

            {projects.length > 1 && (
              <div className="md:col-span-5 grid grid-rows-2 gap-4">
                {projects.slice(1, 3).map((proj) => (
                  <div key={proj.id} className="relative overflow-hidden group min-h-[200px] cursor-pointer">
                    <Image
                      src={proj.image}
                      alt={proj.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 42vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="inline-block bg-primary  text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 mb-2">
                        {proj.type}
                      </span>
                      <h3 className=" font-bold text-base">{proj.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {projects.slice(3).map((proj) => (
              <div key={proj.id} className="md:col-span-6 relative overflow-hidden group min-h-[240px] cursor-pointer">
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block bg-primary  text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 mb-2">
                    {proj.type}
                  </span>
                  <h3 className=" font-bold text-lg mb-1">{proj.title}</h3>
                  <p className="text-ivory/70 text-sm line-clamp-2">{proj.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center flex flex-wrap justify-center gap-4">
          <a
            href="/projects"
            className="group inline-flex items-center gap-3 bg-accent hover:bg-primary  font-bold px-9 py-4 transition-all duration-300 text-sm tracking-widest uppercase"
          >
            View All Projects
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/collections"
            className="group inline-flex items-center gap-3  -[#0f1117] hover:bg-accent   font-bold px-9 py-4 transition-all duration-300 text-sm tracking-widest uppercase"
          >
            Browse Collections
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
