import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/providers/auth_providers.dart';
import 'package:mobile/widgets/custom_button.dart';
import 'package:mobile/widgets/custom_textfield.dart';

enum ResetStep { email, otp, newPassword }

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  ResetStep _currentStep = ResetStep.email;
  bool _isLoading = false;

  // Controllers
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController(); // Validasi lokal

  final _formKey = GlobalKey<FormState>();

  // --- LOGIKA UTAMA ---

  // Langkah 1: Kirim Email
  Future<void> _submitEmail() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await Provider.of<AuthProvider>(
        context,
        listen: false,
      ).requestResetPassword(_emailController.text.trim());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('OTP telah dikirim ke email Anda.')),
        );
        setState(() => _currentStep = ResetStep.otp); // Pindah ke step OTP
      }
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Langkah 2: Verifikasi OTP
  Future<void> _submitOtp() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await Provider.of<AuthProvider>(
        context,
        listen: false,
      ).verifyOtp(_emailController.text.trim(), _otpController.text.trim());

      if (mounted) {
        setState(
          () => _currentStep = ResetStep.newPassword,
        ); // Pindah ke step Password
      }
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Langkah 3: Reset Password
  Future<void> _submitNewPassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await Provider.of<AuthProvider>(context, listen: false).resetPassword(
        _emailController.text.trim(),
        _otpController.text.trim(),
        _newPassController.text,
      );

      if (mounted) {
        // Sukses! Tampilkan dialog dan kembali ke login
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 50,
            ),
            content: const Text(
              'Kata sandi berhasil diubah. Silakan login dengan kata sandi baru.',
              textAlign: TextAlign.center,
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Tutup dialog
                  Navigator.of(context).pop(); // Kembali ke LoginScreen
                },
                child: const Text('Login Sekarang'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message.replaceAll("Exception: ", "")),
        backgroundColor: Colors.red,
      ),
    );
  }

  // --- UI BUILDER ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Lupa Kata Sandi"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Jika di step OTP atau Password, tombol back akan memundurkan step dulu
            if (_currentStep == ResetStep.otp) {
              setState(() => _currentStep = ResetStep.email);
            } else if (_currentStep == ResetStep.newPassword) {
              setState(() => _currentStep = ResetStep.otp);
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Indikator Step (Opsional, teks sederhana)
              Text(
                _getTitleForStep(),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                _getSubtitleForStep(),
                style: TextStyle(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Konten Form Berubah sesuai Step
              if (_currentStep == ResetStep.email) _buildEmailStep(),
              if (_currentStep == ResetStep.otp) _buildOtpStep(),
              if (_currentStep == ResetStep.newPassword)
                _buildNewPasswordStep(),

              const SizedBox(height: 24),

              // Tombol Aksi Utama
              CustomButton(
                text: _getButtonText(),
                isLoading: _isLoading,
                onPressed: () {
                  if (_currentStep == ResetStep.email)
                    _submitEmail();
                  else if (_currentStep == ResetStep.otp)
                    _submitOtp();
                  else
                    _submitNewPassword();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Helper UI ---

  String _getTitleForStep() {
    switch (_currentStep) {
      case ResetStep.email:
        return "Reset Password";
      case ResetStep.otp:
        return "Verifikasi OTP";
      case ResetStep.newPassword:
        return "Buat Kata Sandi Baru";
    }
  }

  String _getSubtitleForStep() {
    switch (_currentStep) {
      case ResetStep.email:
        return "Masukkan email yang terdaftar untuk menerima kode OTP.";
      case ResetStep.otp:
        return "Masukkan kode OTP yang dikirim ke ${_emailController.text}";
      case ResetStep.newPassword:
        return "Masukkan kata sandi baru yang aman.";
    }
  }

  String _getButtonText() {
    switch (_currentStep) {
      case ResetStep.email:
        return "Kirim OTP";
      case ResetStep.otp:
        return "Verifikasi";
      case ResetStep.newPassword:
        return "Simpan Kata Sandi";
    }
  }

  Widget _buildEmailStep() {
    return CustomTextField(
      controller: _emailController,
      hintText: 'Email',
      prefixIcon: Icons.email_outlined,
      validator: (value) {
        if (value == null || value.isEmpty) return 'Email wajib diisi';
        if (!value.contains('@')) return 'Email tidak valid';
        return null;
      },
    );
  }

  Widget _buildOtpStep() {
    return Column(
      children: [
        CustomTextField(
          controller: _otpController,
          hintText: 'Kode OTP',
          prefixIcon: Icons.lock_clock_outlined,
          validator: (value) {
            if (value == null || value.isEmpty) return 'OTP wajib diisi';
            return null;
          },
        ),
        const SizedBox(height: 16),
        // Tombol kirim ulang (bisa ditambahkan logika timer nanti)
        TextButton(
          onPressed: _isLoading
              ? null
              : _submitEmail, // Panggil API request lagi
          child: const Text("Kirim Ulang Kode"),
        ),
      ],
    );
  }

  Widget _buildNewPasswordStep() {
    return Column(
      children: [
        CustomTextField(
          controller: _newPassController,
          hintText: 'Kata Sandi Baru',
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          validator: (value) {
            if (value == null || value.isEmpty) return 'Wajib diisi';
            if (value.length < 6) return 'Minimal 6 karakter';
            return null;
          },
        ),
        const SizedBox(height: 16),
        CustomTextField(
          controller: _confirmPassController,
          hintText: 'Konfirmasi Kata Sandi',
          prefixIcon: Icons.lock_outline,
          isPassword: true,
          validator: (value) {
            if (value != _newPassController.text)
              return 'Kata sandi tidak cocok';
            return null;
          },
        ),
      ],
    );
  }
}
