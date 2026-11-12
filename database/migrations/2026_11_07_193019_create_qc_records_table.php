
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_no')->unique();
            $table->string('category');
            $table->string('test_type');
            $table->date('sample_date');
            $table->string('location');
            $table->string('material');
            $table->string('status')->default('Pending');
            $table->string('tested_by');
            $table->string('reviewed_by')->nullable();
            $table->text('remarks')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index('sample_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_records');
    }
};
