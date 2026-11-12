<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_record_histories', function (Blueprint $table) {
            $table->bigIncrements('id');
            // Intentionally no foreign key: history must survive record deletion.
            $table->integer('qc_record_id')->nullable()->index();
            $table->string('record_no')->index();
            $table->string('action', 30);
            $table->string('changed_by')->default('Unknown user');
            $table->jsonb('snapshot')->nullable();
            $table->jsonb('changes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_record_histories');
    }
};
