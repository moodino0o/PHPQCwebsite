<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('masonry_tests', function (Blueprint $table) {
            $table->id();

            // Test identification
            $table->string('record_no')->unique();
            $table->string('specimen_no')->nullable();
            $table->date('test_date');
            $table->string('location');
            $table->string('block_type'); // Plain or Lined
            $table->string('block_size'); // 4, 6 or 8 inch

            // Block dimensions (mm)
            $table->decimal('length', 10, 2);
            $table->decimal('width', 10, 2);
            $table->decimal('height', 10, 2);

            // Compressive strength
            $table->decimal('net_area', 12, 2)->nullable();
            $table->decimal('failure_load', 12, 3)->nullable();
            $table->decimal('compressive_strength', 10, 3)->nullable();
            $table->decimal('required_strength', 10, 3);

            // Water absorption
            $table->decimal('dry_weight', 10, 3)->nullable();
            $table->decimal('saturated_weight', 10, 3)->nullable();
            $table->decimal('water_absorption', 10, 3)->nullable();
            $table->decimal('max_absorption', 10, 3)->nullable();

            // Density
            $table->decimal('density', 10, 2)->nullable();

            // Assessment
            $table->string('status')->default('Pending');
            $table->string('tested_by');
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index(['block_size', 'block_type']);
            $table->index(['status', 'test_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('masonry_tests');
    }
};
