<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Employee Login | Al Manaratain QC</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f4f8;
            font-family: Arial, sans-serif;
            color: #263449;
        }

        .login-card {
            width: 100%;
            max-width: 420px;
            padding: 38px;
            background: white;
            border-radius: 14px;
            box-shadow: 0 12px 40px rgba(0,0,0,.09);
        }

        .brand {
            text-align: center;
            margin-bottom: 30px;
        }

        .brand-mark {
            display: inline-flex;
            width: 58px;
            height: 58px;
            align-items: center;
            justify-content: center;
            background: #173b63;
            color: white;
            border-radius: 12px;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 12px;
        }

        h1 {
            font-size: 22px;
            margin: 0 0 7px;
        }

        .subtitle {
            color: #718096;
            font-size: 13px;
        }

        label {
            display: block;
            margin: 18px 0 7px;
            font-size: 13px;
            font-weight: 600;
        }

        input {
            width: 100%;
            padding: 13px;
            border: 1px solid #d9e0e8;
            border-radius: 7px;
            font-size: 15px;
        }

        input:focus {
            outline: none;
            border-color: #245b91;
        }

        button {
            width: 100%;
            margin-top: 24px;
            padding: 14px;
            background: #173b63;
            color: white;
            border: none;
            border-radius: 7px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        }

        button:hover {
            background: #245b91;
        }

        .error {
            margin-top: 15px;
            padding: 11px;
            background: #fff0f0;
            border: 1px solid #f3caca;
            color: #a32d2d;
            border-radius: 7px;
            font-size: 13px;
        }

        .footer {
            text-align: center;
            margin-top: 25px;
            color: #8a96a6;
            font-size: 11px;
        }
    </style>
</head>

<body>
    <div class="login-card">
        <div class="brand">
            <div class="brand-mark">AM</div>
            <h1>Al Manaratain Company</h1>
            <div class="subtitle">Quality Control Department</div>
        </div>

        <form method="POST" action="/login">
            @csrf

            <label for="employee_id">Employee ID</label>
            <input
                id="employee_id"
                name="employee_id"
                type="text"
                value="{{ old('employee_id') }}"
                placeholder="Enter your employee ID"
                required
                autofocus
            >

            <label for="password">Password</label>
            <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
            >

            @if ($errors->any())
                <div class="error">
                    {{ $errors->first() }}
                </div>
            @endif

            <button type="submit">Sign In</button>
        </form>

        <div class="footer">
            Al Manaratain Quality Control Department
        </div>
    </div>
</body>
</html>
