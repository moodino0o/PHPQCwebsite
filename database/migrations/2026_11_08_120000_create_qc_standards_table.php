<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_standards', function (Blueprint $table) {
            $table->id();
            $table->string('standard_code')->unique();
            $table->string('title');
            $table->string('category');
            $table->string('issuing_body')->nullable();
            $table->string('edition')->nullable();
            $table->string('revision')->nullable();
            $table->unsignedSmallInteger('publication_year')->nullable();
            $table->string('status')->default('Active');
            $table->text('description')->nullable();
            $table->text('technical_notes')->nullable();
            $table->string('reference_url', 2048)->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_standards');
    }
};
