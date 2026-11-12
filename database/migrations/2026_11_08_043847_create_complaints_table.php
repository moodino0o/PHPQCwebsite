<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();

            $table->string('complaint_no')->unique();
            $table->date('complaint_date');

            $table->string('customer_name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            $table->string('site_name');
            $table->string('location')->nullable();

            $table->string('product_type');
            $table->string('product_size')->nullable();

            $table->date('delivery_date')->nullable();
            $table->string('invoice_no')->nullable();
            $table->string('batch_no')->nullable();

            $table->text('complaint_description');
            $table->text('reported_action')->nullable();

            $table->string('priority')->default('Medium');
            $table->string('status')->default('Open');

            $table->string('assigned_to')->nullable();
            $table->text('investigation')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('corrective_action')->nullable();
            $table->text('preventive_action')->nullable();

            $table->date('resolution_date')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index('complaint_date');
            $table->index('status');
            $table->index('customer_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
