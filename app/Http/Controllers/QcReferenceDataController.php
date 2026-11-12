<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QcReferenceDataController extends Controller
{
    public function index(Request $request)
    {
        $categoryQuery = DB::table('qc_reference_categories')
            ->select('id', 'key', 'label')
            ->orderBy('label');

        if ($request->filled('category')) {
            $categoryQuery->where('key', $request->query('category'));
        }

        $categories = $categoryQuery->get();

        $items = DB::table('qc_reference_items')
            ->select('id', 'category_id', 'value')
            ->whereIn('category_id', $categories->pluck('id'))
            ->orderBy('value')
            ->get()
            ->groupBy('category_id');

        $result = $categories->map(function ($category) use ($items) {
            return [
                'id' => (int) $category->id,
                'key' => $category->key,
                'label' => $category->label,
                'items' => ($items->get($category->id) ?? collect())
                    ->map(function ($item) {
                        return [
                            'id' => (int) $item->id,
                            'value' => $item->value,
                        ];
                    })
                    ->values(),
            ];
        })->values();

        return response()->json($result);
    }
}
