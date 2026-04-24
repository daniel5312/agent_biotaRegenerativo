"use client"

import { useState } from "react"
import { 
  Play, 
  Lock, 
  Award, 
  Clock, 
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Sprout,
  TreePine,
  Droplets,
  Mountain,
  Leaf,
  Flower2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const courses = [
  { id: 1, title: "Caldos Minerales y Biofermentos", lessons: 12, duration: "2h 45m", progress: 75, category: "Nutricion", icon: Droplets, color: "from-cyan-400 to-blue-500" },
  { id: 2, title: "Agricultura Regenerativa 101", lessons: 18, duration: "4h 20m", progress: 100, category: "Regeneracion", icon: Sprout, color: "from-emerald-400 to-green-500" },
  { id: 3, title: "Manejo de Suelos Vivos", lessons: 15, duration: "3h 30m", progress: 45, category: "Suelos", icon: Mountain, color: "from-amber-400 to-orange-500" },
  { id: 4, title: "Sistemas Agroforestales", lessons: 10, duration: "2h 15m", progress: 0, category: "Agroforest", icon: TreePine, color: "from-green-400 to-emerald-500" },
  { id: 5, title: "Certificacion Organica CO", lessons: 8, duration: "1h 50m", progress: 20, category: "Certificacion", icon: Award, color: "from-yellow-400 to-amber-500" },
]

const categoryColors: Record<string, string> = {
  Nutricion: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-600/40",
  Regeneracion: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-600/40",
  Suelos: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-600/40",
  Agroforest: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/40",
  Certificacion: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-600/40",
}

export function AcademiaView() {
  const [claimingNft, setClaimingNft] = useState<number | null>(null)
  const [claimed, setClaimed] = useState<Set<number>>(new Set())

  const handleClaimNft = (courseId: number) => {
    setClaimingNft(courseId)
    setTimeout(() => {
      setClaimed((prev) => new Set([...prev, courseId]))
      setClaimingNft(null)
    }, 1500)
  }

  const completedCount = courses.filter(c => c.progress === 100).length
  const totalProgress = Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)

  return (
    <div className="px-4 py-4 space-y-4 mb-nav">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 animate-slide-up">
        <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-950 dark:text-white font-mono transition-theme">{courses.length}</p>
            <p className="text-[8px] text-emerald-800 dark:text-emerald-400/60 uppercase tracking-wider font-bold">Cursos</p>
          </CardContent>
        </Card>
        <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-green-700 dark:text-green-400 font-mono">{completedCount}</p>
            <p className="text-[8px] text-emerald-800 dark:text-emerald-400/60 uppercase tracking-wider font-bold">Completados</p>
          </CardContent>
        </Card>
        <Card className="glass-card metric-card overflow-hidden bg-emerald-100/80 dark:bg-emerald-900/30">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-cyan-700 dark:text-cyan-400 font-mono">{totalProgress}%</p>
            <p className="text-[8px] text-emerald-800 dark:text-emerald-400/60 uppercase tracking-wider font-bold">Progreso</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between animate-slide-up delay-75">
        <h2 className="text-sm font-bold text-emerald-950 dark:text-white flex items-center gap-2 transition-theme">
          <Leaf className="w-4 h-4 text-emerald-600 animate-leaf-sway" />
          Escuela del Campo
        </h2>
        <Badge className="bg-teal-100 dark:bg-[#00B0A0]/15 text-teal-800 dark:text-[#00B0A0] border-teal-300 dark:border-[#00B0A0]/40 text-[9px] font-bold shadow-sm">
          <Sparkles className="w-3 h-3 mr-1 text-teal-600 dark:text-[#00B0A0]" />
          ReFi Academy
        </Badge>
      </div>

      {/* Courses */}
      <div className="space-y-3">
        {courses.map((course, index) => {
          const isCompleted = course.progress === 100
          const nftClaimed = claimed.has(course.id)
          const isClaiming = claimingNft === course.id
          const CourseIcon = course.icon

          return (
            <Card 
              key={course.id} 
              className="glass-card overflow-hidden animate-slide-up group bg-emerald-100/80 dark:bg-emerald-900/30"
              style={{ animationDelay: `${100 + index * 75}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${course.color} shadow-md
                    ${isCompleted ? "glow-sm" : ""}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : course.progress > 0 ? (
                      <CourseIcon className="w-5 h-5 text-white" />
                    ) : (
                      <Lock className="w-5 h-5 text-white/70" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-emerald-950 dark:text-white leading-tight line-clamp-2 transition-theme">
                        {course.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 group-hover:text-emerald-600 transition-colors" />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${categoryColors[course.category]} text-[8px] px-1.5 py-0 border font-bold shadow-sm`}>
                        {course.category}
                      </Badge>
                      <span className="text-[9px] text-emerald-700 dark:text-gray-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {course.duration}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-500/60 flex items-center gap-1 font-medium">
                          <Sprout className="w-3 h-3 text-green-600" />
                          {course.lessons} lecciones
                        </span>
                        <span className={`text-[9px] font-bold font-mono ${
                          isCompleted ? "text-green-700 dark:text-green-400" : "text-emerald-800 dark:text-emerald-400"
                        }`}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${course.color} rounded-full transition-all`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* NFT Claim */}
                {isCompleted && (
                  <div className="px-3 pb-3">
                    <Button
                      onClick={() => !nftClaimed && handleClaimNft(course.id)}
                      disabled={nftClaimed || isClaiming}
                      size="sm"
                      className={`
                        w-full h-9 text-xs font-bold
                        ${nftClaimed 
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/40" 
                          : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white cyber-btn"
                        }
                      `}
                    >
                      {nftClaimed ? (
                        <><Award className="w-3.5 h-3.5 mr-1.5" /> Certificado Obtenido</>
                      ) : isClaiming ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> Mintando...</>
                      ) : (
                        <><Award className="w-3.5 h-3.5 mr-1.5" /> Cosechar Certificado NFT</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Start Button */}
                {course.progress === 0 && (
                  <div className="px-3 pb-3">
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600/30 hover:border-emerald-400 transition-theme"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Comenzar Curso
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
