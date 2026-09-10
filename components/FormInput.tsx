import { Controller, FieldValues, Control, Path } from 'react-hook-form';
import { Input, InputProps } from '@/components/Input';

interface FormInputProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
}

export function FormInput<T extends FieldValues>({ control, name, ...rest }: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          value={String(value ?? '')}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...rest}
        />
      )}
    />
  );
}
