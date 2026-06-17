<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BackupDatabase extends Command
{
    protected $signature   = 'db:backup {--output= : Arquivo de saída (padrão: storage/app/backup.sql)}';
    protected $description = 'Exporta todo o banco de dados para um arquivo SQL';

    public function handle(): int
    {
        $output = $this->option('output') ?: storage_path('app/backup_' . date('Y-m-d_H-i-s') . '.sql');

        $this->info("Exportando banco de dados para: {$output}");

        $pdo    = DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();
        $sql    = "-- RL Gráfica ERP — Backup gerado em " . now()->toDateTimeString() . "\n";
        $sql   .= "-- Banco: {$dbName}\n\n";
        $sql   .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tables = DB::select('SHOW TABLES');
        $key    = "Tables_in_{$dbName}";

        foreach ($tables as $t) {
            $table = $t->$key;
            $this->line("  → {$table}");

            // Estrutura
            $create = DB::select("SHOW CREATE TABLE `{$table}`")[0];
            $createSql = $create->{'Create Table'};
            $sql .= "DROP TABLE IF EXISTS `{$table}`;\n{$createSql};\n\n";

            // Dados
            $rows = DB::table($table)->get();
            if ($rows->isEmpty()) continue;

            $cols  = array_keys((array) $rows->first());
            $cols  = implode('`, `', $cols);
            $chunk = [];

            foreach ($rows as $row) {
                $values = array_map(function ($v) use ($pdo) {
                    return $v === null ? 'NULL' : $pdo->quote((string) $v);
                }, (array) $row);
                $chunk[] = '(' . implode(', ', $values) . ')';

                if (count($chunk) >= 500) {
                    $sql .= "INSERT INTO `{$table}` (`{$cols}`) VALUES\n" . implode(",\n", $chunk) . ";\n";
                    $chunk = [];
                }
            }

            if (!empty($chunk)) {
                $sql .= "INSERT INTO `{$table}` (`{$cols}`) VALUES\n" . implode(",\n", $chunk) . ";\n";
            }

            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        file_put_contents($output, $sql);
        $kb = round(filesize($output) / 1024, 1);
        $this->info("✅ Backup concluído: {$output} ({$kb} KB)");

        return Command::SUCCESS;
    }
}
