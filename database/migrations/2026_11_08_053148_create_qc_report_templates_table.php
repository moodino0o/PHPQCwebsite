<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_report_templates', function (Blueprint $table) {
            $table->id();
            $table->string('test_type');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->json('design');
            $table->json('history')->nullable();
            $table->timestamps();

            $table->index('test_type');
            $table->index(['test_type', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_report_templates');
    }
};