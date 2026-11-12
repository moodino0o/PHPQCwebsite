
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_archived_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_number')->unique();
            $table->string('title');
            $table->string('report_type');
            $table->string('customer')->nullable();
            $table->string('reference_number')->nullable();
            $table->date('report_date')->nullable();
            $table->string('status')->default('Archived');
            $table->json('report_data')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('report_type');
            $table->index('report_date');
            $table->index('customer');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_archived_reports');
    }
};
