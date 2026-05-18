import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "pt";

interface TranslationDictionary {
  [key: string]: {
    en: string;
    pt: string;
  };
}

export const translations: TranslationDictionary = {
  "app.title": { en: "PAPER FABRIK", pt: "PAPER FABRIK" },
  "nav.projects": { en: "PROJECTS", pt: "PROJETOS" },
  "nav.materials": { en: "MATERIALS", pt: "MATERIAIS" },
  "nav.machines": { en: "MACHINES", pt: "MÁQUINAS" },
  "nav.settings": { en: "SETTINGS", pt: "CONFIGURAÇÕES" },
  "nav.libraries": { en: "LIBRARIES", pt: "BIBLIOTECAS" },
  "nav.machine_queue": { en: "MACHINE QUEUE", pt: "FILA DE MÁQUINAS" },
  "nav.cloud_sync": { en: "CLOUD SYNC", pt: "NUVEM (SYNC)" },
  
  "panel.cad.title": { en: "CAD ENGINEERING", pt: "ENGENHARIA CAD" },
  "panel.cad.action": { en: "ENGINEERING PLAN", pt: "PLANO DE ENGENHARIA" },
  "panel.3d.title": { en: "MODIFIERS SQUAD", pt: "MODIFICADORES SQUAD" },
  "panel.3d.action": { en: "APPLY ALL MODIFIERS", pt: "APLICAR MODIFICADORES" },
  "panel.cnc.title": { en: "PRECISION CNC ROUTER", pt: "ROUTER CNC DE PRECISÃO" },
  "panel.cnc.action": { en: "GENERATE G-CODE", pt: "GERAR G-CODE" },
  "panel.pkg.title": { en: "DIE-CUT TEMPLATES", pt: "MOLDES DE CORTE" },
  "panel.pkg.action": { en: "EXPORT DIELINE", pt: "EXPORTAR FACA" },
  "panel.pcb.title": { en: "ELECTRONICS & PCB", pt: "ELETRÔNICA E PCB" },
  "panel.pcb.action": { en: "PCB AUDIT", pt: "AUDITORIA PCB" },
  "panel.bim.title": { en: "BIM ARCHITECTURE", pt: "ARQUITETURA BIM" },
  "panel.bim.action": { en: "EXTRACT PARTS", pt: "EXTRAIR PEÇAS" },

  "bim.data": { en: "REVIT / BIM DATA", pt: "DADOS REVIT / BIM" },
  "bim.no_model": { en: "NO MODEL LOADED", pt: "NENHUM MODELO" },
  "bim.import": { en: "Import", pt: "Importar" },
  "bim.export": { en: "Export", pt: "Exportar" },
  "bim.custom_beam": { en: "Custom Beam (Timber)", pt: "Viga Customizada (Madeira)" },
  "bim.length": { en: "Length (mm)", pt: "Comprimento (mm)" },
  "bim.profile": { en: "Profile", pt: "Perfil" },
  "bim.material": { en: "Material", pt: "Material" },
  "bim.material.val": { en: "Oak, Solid", pt: "Carvalho, Maciço" },
  "bim.join": { en: "Join", pt: "Encaixe" },
  "bim.join.val": { en: "Mortise & Tenon", pt: "Fura e Espiga" },
  "bim.cnc_path": { en: "CNC Cut Path", pt: "Caminho de Corte CNC" },
  "bim.tool": { en: "Tool", pt: "Fresa" },
  "bim.passes": { en: "Passes", pt: "Passes" },
  "bim.time": { en: "Est. Time", pt: "Tempo Est." },
  "bim.isolate": { en: "ISOLATE PART", pt: "ISOLAR PEÇA" },
  "bim.parsing": { en: "Parsing .rvt data...", pt: "Analisando dados .rvt..." },
  "bim.extracting": { en: "Extracting BIM parameters...", pt: "Extraindo parâmetros BIM..." },
  "bim.loaded": { en: "Loaded", pt: "Carregado" },
  "bim.generating": { en: "Generating customized .rvt...", pt: "Gerando .rvt customizado..." },
  "bim.exported": { en: "Exported successfully!", pt: "Exportado com sucesso!" },
  "bim.alert.invalid": { en: "Please upload a valid Revit (.rvt) file.", pt: "Por favor, envie um arquivo Revit (.rvt) válido." },
  "bim.alert.nomodel": { en: "Please import a Revit model first.", pt: "Por favor, importe um modelo Revit primeiro." },
  "bim.wall_stud": { en: "Wall Stud", pt: "Montante de Parede" },
  "bim.pine": { en: "Pine", pt: "Pinho" },
  "bim.oak": { en: "Oak", pt: "Carvalho" },
  "bim.walnut": { en: "Walnut", pt: "Nogueira" },
  "bim.maple": { en: "Maple", pt: "Bordo" },
  "bim.steel": { en: "Steel", pt: "Aço" },
  "bim.properties": { en: "Properties", pt: "Propriedades" },

  "cad.tree": { en: "Feature Tree", pt: "Árvore de Recursos" },
  "cad.render_settings": { en: "Render Settings", pt: "Configurações de Render" },
  "cad.resolution": { en: "Output Resolution", pt: "Resolução de Saída" },
  "cad.anti_aliasing": { en: "Anti-Aliasing", pt: "Anti-Serrilhado" },
  "cad.anti_aliasing_desc": { en: "Smooth vector rendering", pt: "Suavização de vetores" },
  "cad.export_format": { en: "Export Format", pt: "Formato de Exportação" },
  "cad.export": { en: "Export Design", pt: "Exportar Design" },
  "cad.cancel": { en: "Cancel", pt: "Cancelar" },
  "cad.save": { en: "Save", pt: "Salvar" },
  "cad.oak": { en: "Oak", pt: "Carvalho" },
  "cad.pine": { en: "Pine", pt: "Pinheiro" },
  "cad.walnut": { en: "Walnut", pt: "Nogueira" },
  "cad.maple": { en: "Maple", pt: "Bordo" },
  "cad.steel": { en: "Steel", pt: "Aço" },
  "cad.resolution_low": { en: "Low", pt: "Baixa" },
  "cad.resolution_medium": { en: "Medium", pt: "Média" },
  "cad.resolution_high": { en: "High", pt: "Alta" },
  "cad.format_png": { en: "PNG Image (.png)", pt: "Imagem PNG (.png)" },
  "cad.format_jpg": { en: "JPEG Image (.jpg)", pt: "Imagem JPEG (.jpg)" },
  "cad.format_stl": { en: "STL Mesh (.stl)", pt: "Malha STL (.stl)" },
  "cad.base_sketch": { en: "Base_Sketch", pt: "Esboço_Base" },
  "cad.top": { en: "TOP", pt: "TOPO" },

  // Photogrammetry Keys
  "photo.title": { en: "Photogrammetry Engine", pt: "Motor de Fotogrametria" },
  "photo.camera_alignment": { en: "Camera Alignment", pt: "Alinhamento de Câmera" },
  "photo.feature_extraction": { en: "Feature Extraction", pt: "Extração de Características" },
  "photo.structure_from_motion": { en: "Structure from Motion", pt: "Estrutura por Movimento" },
  "photo.meshing": { en: "Depth Map & Meshing", pt: "Mapa de Profundidade e Malha" },
  "photo.total_points": { en: "Total Points", pt: "Total de Pontos" },
  "photo.reprojection_error": { en: "Reprojection Error", pt: "Erro de Reprojeção" },
  "photo.processing_node": { en: "Processing Node", pt: "Nodo de Processamento" },
  "photo.status_idle": { en: "Idle", pt: "Ocioso" },
  "photo.status_running": { en: "Processing", pt: "Processando" },
  "photo.status_success": { en: "Success", pt: "Sucesso" },
  "photo.status_error": { en: "Failure", pt: "Falha" },

  // Simulation Keys
  "sim.title": { en: "Structural Analysis", pt: "Análise Estrutural" },
  "sim.run": { en: "Run Load Simulation", pt: "Executar Simulação de Carga" },
  "sim.peak_stress": { en: "Peak Stress", pt: "Estresse de Pico" },
  "sim.safety_factor": { en: "Safety Factor", pt: "Fator de Segurança" },
  "sim.deformation": { en: "Deformation", pt: "Deformação" },
  "sim.status_solving": { en: "Solving Matrix...", pt: "Resolvendo Matriz..." },

  "3d.printing": { en: "PRINTING", pt: "IMPRESSÃO" },
  "3d.layer": { en: "Layer", pt: "Camada" },
  "3d.time_rem": { en: "Time Rem.", pt: "Tempo Rest." },
  "3d.material": { en: "Material", pt: "Material" },
  "3d.temp": { en: "Nozzle", pt: "Bico" },
  "3d.bed": { en: "Bed", pt: "Mesa" },
  "3d.gcode_gen": { en: "G-Code Preview Generation", pt: "Geração Visual de G-Code" },
  "3d.support": { en: "Support: Auto (Tree)", pt: "Suporte: Auto (Árvore)" },
  "3d.infill": { en: "Infill: 20% Gyroid", pt: "Preenchimento: 20% Giroide" },

  "cnc.milling": { en: "MILLING", pt: "FRESAMENTO" },
  "cnc.toolpath": { en: "Toolpath", pt: "Caminho da Fresa" },
  "cnc.spindle": { en: "Spindle", pt: "Spindle" },
  "cnc.feed": { en: "Feed", pt: "Avanço" },
  "cnc.status": { en: "Status", pt: "Status" },
  "cnc.plunge": { en: "Plunge Rate", pt: "Avanço de Mergulho" },
  "cnc.run_job": { en: "RUN JOB", pt: "RODAR TRABALHO" },
  "cnc.tool": { en: "Tool: End Mill", pt: "Fresa de Topo" },
  "cnc.offset": { en: "Offset: Exterior", pt: "Offset: Exterior" },

  "pkg.cut": { en: "Cut", pt: "Corte" },
  "pkg.crease": { en: "Crease", pt: "Vinco" },
  "pkg.fold": { en: "Fold", pt: "Dobra" },
  "pkg.viewport": { en: "Viewport: 1:1 Scale", pt: "Janela: Escala 1:1" },
  "pkg.printer": { en: "Printer", pt: "Impressora" },

  "pcb.telemetry": { en: "Live Telemetry", pt: "Telemetria Info" },
  "pcb.layer": { en: "Active Layer", pt: "Camada Ativa" },
  "pcb.gerber": { en: "GENERATE GERBER", pt: "GERAR GERBER" },
  "pcb.top_copper": { en: "Top Copper (F.Cu)", pt: "Cobre Superior (F.Cu)" },

  "panel.tinker.title": { en: "ELECTRONICS SIM", pt: "SIM DE ELETRÔNICA" },
  "panel.tinker.action": { en: "UPLOAD FIRMWARE", pt: "ENVIAR FIRMWARE" },

  "panel.pbr.title": { en: "PBR MATERIAL STUDIO", pt: "ESTÚDIO MATERIAL PBR" },
  "panel.pbr.action": { en: "EXPORT TEXTURE", pt: "EXPORTAR TEXTURA" },
  "panel.openscad.title": { en: "SCRIPTING CAD", pt: "CAD POR CÓDIGO" },
  "panel.openscad.action": { en: "RENDER SCRIPT", pt: "RENDERIZAR SCRIPT" },
  "panel.hyworld.title": { en: "AI 3D WORLD GEN", pt: "GERAÇÃO MUNDO 3D IA" },
  "panel.hyworld.action": { en: "SYNTHESIZE", pt: "SINTETIZAR" },
  "pbr.layers": { en: "Layers", pt: "Camadas" },
  "pbr.smart_materials": { en: "Smart Materials", pt: "Materiais Inteligentes" },
  "pbr.properties": { en: "Material Properties", pt: "Propriedades" },
  "pbr.mat.rust": { en: "Smart Rust", pt: "Ferrugem Int." },
  "pbr.mat.chrome": { en: "Scratched Chrome", pt: "Cromo Riscado" },
  "pbr.mat.wood": { en: "Varnished Wood", pt: "Madeira Envernizada" },
  "pbr.mat.maple": { en: "Maple", pt: "Bordo" },
  "pbr.mat.steel": { en: "Brushed Steel", pt: "Aço Escovado" },
  "pbr.roughness": { en: "Roughness", pt: "Rugosidade" },
  "pbr.metalness": { en: "Metalness", pt: "Metalização" },
  "pbr.ao": { en: "Ambient Occlusion", pt: "Oclusão Ambiental" },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string) => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
