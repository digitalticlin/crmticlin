import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";

export default function Integration() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <ResponsiveSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Integração</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Configure suas integrações com outros serviços aqui.
              </p>
              
              {/* Integration content will go here */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 flex items-center justify-center h-64">
                <span className="text-gray-500 dark:text-gray-400">
                  Página em desenvolvimento
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
